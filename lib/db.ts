import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { User, Role, Location, Order } from './store';

/**
 * DATA STORAGE SYSTEM
 * 
 * Files are stored as: data/users/{role}/{SanitizedFullName}.json
 * 
 * MIGRATION NOTE:
 * - New users will be saved with human-readable filenames based on fullName
 * - Old files with ID-based names (e.g., "abc123.json") will still work
 *   because all search functions scan the entire directory
 * - This ensures backward compatibility while making new files readable
 */

// Base directory for data storage
const BASE_DIR = path.join(process.cwd(), 'data', 'users');
const LOCATIONS_DIR = path.join(process.cwd(), 'data', 'locations');

/**
 * Ensures a directory exists, creating it recursively if needed
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Sanitizes a filename by removing illegal characters
 * Removes: / \ : * ? " < > |
 * Trims spaces
 */
function sanitizeFilename(name: string): string {
  // Remove illegal characters for filenames
  const illegalChars = /[\/\\:*?"<>|]/g;
  let sanitized = name.replace(illegalChars, '');
  
  // Trim spaces
  sanitized = sanitized.trim();
  
  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized;
}

/**
 * Saves a user to a JSON file in the file system
 * Path structure: data/users/{role}/{SanitizedFullName}.json
 * Falls back to email or id if fullName is missing
 * Adds short ID suffix if file already exists (overwrite protection)
 */
export async function saveUser(user: User): Promise<void> {
  const roleDir = path.join(BASE_DIR, user.role);
  await ensureDirectoryExists(roleDir);
  
  // Generate filename from fullName, email, or id (in that order)
  let baseFilename: string;
  if (user.fullName && user.fullName.trim()) {
    baseFilename = sanitizeFilename(user.fullName);
  } else if (user.email && user.email.trim()) {
    baseFilename = sanitizeFilename(user.email);
  } else {
    baseFilename = user.id;
  }
  
  // Check if file already exists
  let filename = `${baseFilename}.json`;
  let filePath = path.join(roleDir, filename);
  
  try {
    await fs.access(filePath);
    // File exists - check if it's the same user (by ID)
    const existingContent = await fs.readFile(filePath, 'utf-8');
    const existingUser: User = JSON.parse(existingContent);
    
    // If it's the same user, we can overwrite
    if (existingUser.id === user.id) {
      // Same user, safe to overwrite
    } else {
      // Different user with same name - append short ID
      const shortId = user.id.slice(0, 8); // Use first 8 characters of ID
      filename = `${baseFilename}_${shortId}.json`;
      filePath = path.join(roleDir, filename);
    }
  } catch {
    // File doesn't exist, we can use the base filename
  }
  
  const userData = JSON.stringify(user, null, 2);
  await fs.writeFile(filePath, userData, 'utf-8');
}

/**
 * Finds a user by credentials using Deep Content Scan
 * Since files are named by Full Name (not email/phone), we MUST scan all files and check their content
 * 
 * LOGIC:
 * - For director/manager: Match by email OR phone, verify password
 * - For employee: Match by businessId (companyCode), verify pin
 * 
 * @param role - User role (director, manager, employee)
 * @param identifier - Email/phone (for director/manager) or company code (for employee)
 * @param secret - Password (for director/manager) or PIN (for employee)
 * @returns User object if found and credentials match, null otherwise
 */
export async function findUserByCredentials(
  role: Role,
  identifier: string,
  secret: string
): Promise<User | null> {
  // 1. Define path: data/users/{role}
  const roleDir = path.join(process.cwd(), 'data', 'users', role);
  
  // 2. Check if directory exists. If not, return null.
  try {
    await fs.access(roleDir);
  } catch {
    console.log(`[findUserByCredentials] Directory does not exist: ${roleDir}`);
    return null;
  }
  
  // Normalize identifier for comparison (lowercase, trim)
  const normalizedIdentifier = identifier.toLowerCase().trim();
  
  console.log(`[findUserByCredentials] Scanning ${role} files. Looking for identifier: "${identifier}" (normalized: "${normalizedIdentifier}")`);
  
  // SPECIAL CASE: Employee Terminal Login
  if (role === 'employee') {
    // Step 1: Try Global Company Code (Find Director by companyCode)
    const directorDir = path.join(BASE_DIR, 'director');
    let targetBusinessId: string | null = null;
    let targetLocationId: string | null = null;
    
    try {
      await fs.access(directorDir);
      const directorFiles = await fs.readdir(directorDir);
      const directorJsonFiles = directorFiles.filter(file => file.endsWith('.json'));
      
      console.log(`[findUserByCredentials] Terminal Login: Scanning ${directorJsonFiles.length} director files for companyCode: "${identifier}"`);
      
      for (const dirFile of directorJsonFiles) {
        const dirFilePath = path.join(directorDir, dirFile);
        try {
          const dirContent = await fs.readFile(dirFilePath, 'utf-8');
          const director: User = JSON.parse(dirContent);
          
          // Normalize company codes for comparison (remove dashes, lowercase)
          const normalizedDirectorCode = (director.companyCode || '').replace(/-/g, '').toLowerCase().trim();
          const normalizedInputCode = normalizedIdentifier.replace(/-/g, '');
          
          if (normalizedDirectorCode === normalizedInputCode) {
            targetBusinessId = director.businessId || director.id;
            console.log(`[findUserByCredentials] Found director with companyCode: ${director.companyCode}, businessId: ${targetBusinessId}`);
            break;
          }
        } catch (error) {
          console.error(`[findUserByCredentials] Error reading director file ${dirFilePath}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error(`[findUserByCredentials] Error accessing director directory:`, error);
    }
    
    // Step 2: Try Location Access Code (if Director not found)
    if (!targetBusinessId) {
      console.log(`[findUserByCredentials] No director found with companyCode: "${identifier}"`);
      console.log(`[findUserByCredentials] Checking Location Access Code: "${identifier}"`);
      
      try {
        await fs.access(LOCATIONS_DIR);
        const locationFiles = await fs.readdir(LOCATIONS_DIR);
        const locationJsonFiles = locationFiles.filter(file => file.endsWith('.json'));
        
        console.log(`[findUserByCredentials] Scanning ${locationJsonFiles.length} location files for accessCode: "${identifier}"`);
        
        for (const locFile of locationJsonFiles) {
          const locFilePath = path.join(LOCATIONS_DIR, locFile);
          try {
            const locContent = await fs.readFile(locFilePath, 'utf-8');
            const location: Location = JSON.parse(locContent);
            
            // Normalize access codes for comparison (remove dashes, lowercase)
            const normalizedLocationCode = (location.accessCode || '').replace(/-/g, '').toLowerCase().trim();
            const normalizedInputCode = normalizedIdentifier.replace(/-/g, '');
            
            if (normalizedLocationCode === normalizedInputCode) {
              targetLocationId = location.id;
              targetBusinessId = location.businessId;
              console.log(`[findUserByCredentials] Found Location by Code: "${location.name}", locationId: ${targetLocationId}, businessId: ${targetBusinessId}`);
              break;
            }
          } catch (error) {
            console.error(`[findUserByCredentials] Error reading location file ${locFilePath}:`, error);
            continue;
          }
        }
      } catch (error) {
        console.error(`[findUserByCredentials] Error accessing locations directory:`, error);
      }
    }
    
    // Step 3: If neither Director nor Location found, return null
    if (!targetBusinessId) {
      console.log(`[findUserByCredentials] Terminal Login FAILED: No director or location found with code: "${identifier}"`);
      return null;
    }
    
    // Step 4: Search employees by businessId + PIN (and optionally assignedPointId)
    try {
      await fs.access(roleDir);
      const files = await fs.readdir(roleDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      console.log(`[findUserByCredentials] Terminal Login: Scanning ${jsonFiles.length} employee files for businessId: "${targetBusinessId}"${targetLocationId ? `, locationId: "${targetLocationId}"` : ''} and PIN: "${secret}"`);
      
      for (const file of jsonFiles) {
        const filePath = path.join(roleDir, file);
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const user: User = JSON.parse(fileContent);
          
          // Match by businessId AND PIN
          const userBusinessId = user.businessId || '';
          const normalizedUserBusinessId = userBusinessId.replace(/-/g, '').toLowerCase().trim();
          const normalizedTargetBusinessId = targetBusinessId.replace(/-/g, '').toLowerCase().trim();
          
          const businessIdMatch = normalizedUserBusinessId === normalizedTargetBusinessId;
          const pinMatch = user.pin === secret;
          
          // Optional: If we found via Location Code, also check assignedPointId for strict binding
          let locationMatch = true;
          if (targetLocationId) {
            locationMatch = user.assignedPointId === targetLocationId;
            if (!locationMatch) {
              console.log(`[findUserByCredentials] Employee ${user.fullName || user.name} has assignedPointId: "${user.assignedPointId}", but location code points to: "${targetLocationId}"`);
            }
          }
          
          if (businessIdMatch && pinMatch && locationMatch) {
            console.log(`[findUserByCredentials] Terminal Login SUCCESS! Employee found: ${user.fullName || user.name}`);
            return user;
          }
        } catch (error) {
          console.error(`[findUserByCredentials] Error reading employee file ${filePath}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error(`[findUserByCredentials] Error reading employee directory:`, error);
    }
    
    console.log(`[findUserByCredentials] Terminal Login FAILED: No employee found with businessId: "${targetBusinessId}"${targetLocationId ? `, locationId: "${targetLocationId}"` : ''} and PIN: "${secret}"`);
    return null;
  }
  
  // STANDARD LOGIN: Director/Manager
  try {
    // 3. Read all filenames (fs.readdir)
    const files = await fs.readdir(roleDir);
    
    // Filter to only JSON files
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`[findUserByCredentials] Found ${jsonFiles.length} JSON files in ${roleDir}`);
    
    // 4. Loop through files - DEEP SCAN
    for (const file of jsonFiles) {
      const filePath = path.join(roleDir, file);
      
      try {
        // Read file content (fs.readFile)
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // Parse JSON
        let user: User;
        try {
          user = JSON.parse(fileContent);
        } catch (parseError) {
          console.error(`[findUserByCredentials] JSON parse error in file "${filePath}":`, parseError);
          continue;
        }
        
        // CRITICAL DEBUG LOG: Show what we're comparing
        console.log(`[findUserByCredentials] Scanning file: "${file}" -> Email: "${user.email || 'N/A'}", Phone: "${user.phone || 'N/A'}", BusinessId: "${user.businessId || 'N/A'}"`);
        
        // 5. MATCHING LOGIC based on role
        let isMatch = false;
        let secretMatch = false;
        
        if (role === 'director' || role === 'manager') {
          // For director/manager: Match by email OR phone
          const userEmail = user.email ? user.email.toLowerCase().trim() : '';
          const emailMatch = userEmail === normalizedIdentifier;
          const phoneMatch = !!(user.phone && user.phone.trim() === identifier.trim()); // Phone numbers might have + or spaces
          
          isMatch = emailMatch || phoneMatch;
          
          // Verify password - ensure both are strings and compare
          const userPassword = user.password || '';
          const inputPassword = secret || '';
          secretMatch = String(userPassword) === String(inputPassword);
          
          // Debug logging
          if (emailMatch || phoneMatch) {
            console.log(`[findUserByCredentials] Identifier match found in file "${file}":`);
            console.log(`  - Email in file: "${user.email || 'N/A'}" (normalized: "${userEmail}")`);
            console.log(`  - Input identifier: "${identifier}" (normalized: "${normalizedIdentifier}")`);
            console.log(`  - Email match: ${emailMatch}, Phone match: ${phoneMatch}`);
            console.log(`  - Password in file: "${userPassword}"`);
            console.log(`  - Input password: "${inputPassword}"`);
            console.log(`  - Password match: ${secretMatch}`);
          }
          
          if (isMatch) {
            if (secretMatch) {
              console.log(`[findUserByCredentials] Password verified! User found: ${user.email || user.phone}`);
              return user;
            } else {
              console.log(`[findUserByCredentials] Wrong password for user in file "${file}"`);
              console.log(`  Expected: "${userPassword}", Got: "${inputPassword}"`);
              // Continue searching in case there are multiple users with same email/phone (shouldn't happen, but safe)
            }
          }
        } else if (role === 'employee') {
          // TERMINAL LOGIN FLOW:
          // Step 1: Find Director by companyCode (identifier is the company code)
          // Step 2: Find Employee by businessId (from director) AND PIN (secret)
          
          // This logic will be handled OUTSIDE the employee file loop
          // We need to find director first, then search employees
        }
        
      } catch (error) {
        // Skip files that can't be parsed - don't crash the whole login
        console.error(`[findUserByCredentials] Error reading user file "${filePath}":`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`[findUserByCredentials] Error reading directory ${roleDir}:`, error);
    return null;
  }
  
  // 6. If loop finishes with no match, return null
  console.log(`[findUserByCredentials] No matching user found for ${role} with identifier "${identifier}"`);
  return null;
}

/**
 * Finds a user by email (for directors/managers)
 */
export async function findUserByEmail(role: Role, email: string): Promise<User | null> {
  const roleDir = path.join(BASE_DIR, role);
  
  try {
    await fs.access(roleDir);
  } catch {
    return null;
  }
  
  try {
    const files = await fs.readdir(roleDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const filePath = path.join(roleDir, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const user: User = JSON.parse(fileContent);
        
        if (user.role === role && user.email === email) {
          return user;
        }
      } catch (error) {
        console.error(`Error reading user file ${filePath}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${roleDir}:`, error);
    return null;
  }
  
  return null;
}

/**
 * Finds a user by PIN (for employees)
 * Scans all files in data/users/employee/ directory since files are named by fullName
 * 
 * @param pin - Employee PIN
 * @param companyCode - Optional company code to verify (normalized for comparison)
 * @returns User object if found and PIN matches, null otherwise
 */
export async function findUserByPin(pin: string, companyCode?: string): Promise<User | null> {
  const roleDir = path.join(BASE_DIR, 'employee');
  
  try {
    await fs.access(roleDir);
  } catch {
    return null;
  }
  
  try {
    const files = await fs.readdir(roleDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const filePath = path.join(roleDir, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const user: User = JSON.parse(fileContent);
        
        if (user.role === 'employee' && user.pin === pin) {
          // If company code is provided, verify it matches user's businessId
          if (companyCode) {
            // Normalize company codes (remove dashes) for comparison
            const normalizedCode = companyCode.replace(/-/g, '').toLowerCase();
            const normalizedBusinessId = (user.businessId || '').replace(/-/g, '').toLowerCase();
            
            if (normalizedCode === normalizedBusinessId) {
              return user;
            }
            // If codes don't match, continue searching
            continue;
          }
          // No company code provided, return first match
          return user;
        }
      } catch (error) {
        console.error(`Error reading user file ${filePath}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${roleDir}:`, error);
    return null;
  }
  
  return null;
}

/**
 * Updates a user's data in the JSON file
 * 
 * @param role - User role (director, manager, employee)
 * @param userId - User ID to find the user
 * @param updates - Partial User object with fields to update
 * @returns Updated User object, or null if user not found
 */
export async function updateUser(
  role: Role,
  userId: string,
  updates: Partial<User>
): Promise<User | null> {
  const roleDir = path.join(BASE_DIR, role);
  
  // Check if directory exists
  try {
    await fs.access(roleDir);
  } catch {
    console.log(`[updateUser] Directory does not exist: ${roleDir}`);
    return null;
  }
  
  try {
    // Read all files in the role directory
    const files = await fs.readdir(roleDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // Find the file containing the user with matching ID
    let oldFilePath: string | null = null;
    let oldUser: User | null = null;
    
    for (const file of jsonFiles) {
      const filePath = path.join(roleDir, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const user: User = JSON.parse(fileContent);
        
        if (user.id === userId) {
          oldFilePath = filePath;
          oldUser = user;
          break;
        }
      } catch (error) {
        console.error(`[updateUser] Error reading file ${filePath}:`, error);
        continue;
      }
    }
    
    if (!oldUser || !oldFilePath) {
      console.log(`[updateUser] User with ID ${userId} not found in ${role} directory`);
      return null;
    }
    
    // Merge old user data with updates
    const newUser: User = { ...oldUser, ...updates };
    
    // Determine if we need to rename the file (if fullName changed)
    const oldFullName = oldUser.fullName || oldUser.email || oldUser.id;
    const newFullName = newUser.fullName || newUser.email || newUser.id;
    const nameChanged = oldFullName !== newFullName;
    
    // Generate new filename if name changed
    let newFilePath: string;
    if (nameChanged) {
      let baseFilename: string;
      if (newUser.fullName && newUser.fullName.trim()) {
        baseFilename = sanitizeFilename(newUser.fullName);
      } else if (newUser.email && newUser.email.trim()) {
        baseFilename = sanitizeFilename(newUser.email);
      } else {
        baseFilename = newUser.id;
      }
      
      const newFilename = `${baseFilename}.json`;
      newFilePath = path.join(roleDir, newFilename);
      
      // Check if new filename already exists (and it's not the same file)
      try {
        await fs.access(newFilePath);
        // File exists - check if it's the same user
        const existingContent = await fs.readFile(newFilePath, 'utf-8');
        const existingUser: User = JSON.parse(existingContent);
        
        if (existingUser.id !== newUser.id) {
          // Different user with same name - append short ID
          const shortId = newUser.id.slice(0, 8);
          const filenameWithId = `${baseFilename}_${shortId}.json`;
          newFilePath = path.join(roleDir, filenameWithId);
        }
      } catch {
        // New filename doesn't exist, we can use it
      }
    } else {
      // Keep the same filename
      newFilePath = oldFilePath;
    }
    
    // Write updated user data
    const userData = JSON.stringify(newUser, null, 2);
    await fs.writeFile(newFilePath, userData, 'utf-8');
    
    // If file was renamed, delete the old file
    if (nameChanged && oldFilePath !== newFilePath) {
      try {
        fsSync.unlinkSync(oldFilePath);
        console.log(`[updateUser] Deleted old file: ${oldFilePath}`);
      } catch (error) {
        console.error(`[updateUser] Error deleting old file ${oldFilePath}:`, error);
        // Continue anyway - the new file is already written
      }
    }
    
    console.log(`[updateUser] Successfully updated user ${userId} in ${role} directory`);
    return newUser;
    
  } catch (error) {
    console.error(`[updateUser] Error updating user ${userId}:`, error);
    return null;
  }
}

/**
 * LOCATIONS FILE SYSTEM STORAGE
 * Files are stored as: data/locations/{locationName}.json
 */

/**
 * Saves a location to a JSON file in the file system
 * Path structure: data/locations/{sanitizedLocationName}.json
 * 
 * Handles file renaming if location name changes
 */
export async function saveLocation(location: Location): Promise<void> {
  await ensureDirectoryExists(LOCATIONS_DIR);
  
  // Step 1: Check for existing file with this location ID
  let oldFilePath: string | null = null;
  
  try {
    const files = await fs.readdir(LOCATIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const filePath = path.join(LOCATIONS_DIR, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const existingLocation: Location = JSON.parse(fileContent);
        
        if (existingLocation.id === location.id) {
          oldFilePath = filePath;
          break;
        }
      } catch (error) {
        console.error(`Error reading location file ${filePath}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error reading locations directory:`, error);
  }
  
  // Step 2: Generate new filename from location name
  let baseFilename: string;
  if (location.name && location.name.trim()) {
    baseFilename = sanitizeFilename(location.name);
  } else {
    // Fallback to ID if name is empty
    baseFilename = location.id;
  }
  
  const newFilename = `${baseFilename}.json`;
  const newFilePath = path.join(LOCATIONS_DIR, newFilename);
  
  // Step 3: Check if new filename already exists (and it's not the same file)
  let finalFilePath = newFilePath;
  if (oldFilePath && oldFilePath !== newFilePath) {
    // Check if new filename is taken by a different location
    try {
      await fs.access(newFilePath);
      const existingContent = await fs.readFile(newFilePath, 'utf-8');
      const existingLocation: Location = JSON.parse(existingContent);
      
      if (existingLocation.id !== location.id) {
        // Different location with same name - append short ID
        const shortId = location.id.slice(0, 8);
        const filenameWithId = `${baseFilename}_${shortId}.json`;
        finalFilePath = path.join(LOCATIONS_DIR, filenameWithId);
      }
    } catch {
      // New filename doesn't exist, we can use it
      finalFilePath = newFilePath;
    }
  }
  
  // Step 4: Write the file
  const locationData = JSON.stringify(location, null, 2);
  await fs.writeFile(finalFilePath, locationData, 'utf-8');
  
  // Step 5: Delete old file if it was renamed
  if (oldFilePath && oldFilePath !== finalFilePath) {
    try {
      fsSync.unlinkSync(oldFilePath);
      console.log(`[saveLocation] Deleted old file: ${oldFilePath}`);
    } catch (error) {
      console.error(`[saveLocation] Error deleting old file ${oldFilePath}:`, error);
      // Continue anyway - the new file is already written
    }
  }
}

/**
 * Gets all locations for a specific business
 * Scans the locations directory and filters by businessId
 * 
 * @param businessId - Business ID to filter locations
 * @returns Array of Location objects
 */
export async function getLocations(businessId: string): Promise<Location[]> {
  try {
    await fs.access(LOCATIONS_DIR);
  } catch {
    // Directory doesn't exist, return empty array
    return [];
  }
  
  try {
    const files = await fs.readdir(LOCATIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const locations: Location[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(LOCATIONS_DIR, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const location: Location = JSON.parse(fileContent);
        
        // Filter by businessId if provided
        if (!businessId || location.businessId === businessId) {
          locations.push(location);
        }
      } catch (error) {
        console.error(`Error reading location file ${filePath}:`, error);
        continue;
      }
    }
    
    return locations;
  } catch (error) {
    console.error(`Error reading locations directory ${LOCATIONS_DIR}:`, error);
    return [];
  }
}

/**
 * Deletes a location file from the file system
 * Scans all files to find the one with matching location ID
 * 
 * @param locationId - Location ID to delete
 */
export async function deleteLocation(locationId: string): Promise<void> {
  try {
    await fs.access(LOCATIONS_DIR);
  } catch {
    throw new Error('Locations directory does not exist');
  }
  
  try {
    const files = await fs.readdir(LOCATIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const filePath = path.join(LOCATIONS_DIR, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const location: Location = JSON.parse(fileContent);
        
        if (location.id === locationId) {
          await fs.unlink(filePath);
          console.log(`[deleteLocation] Deleted location file: ${filePath}`);
          return;
        }
      } catch (error) {
        console.error(`Error reading location file ${filePath}:`, error);
        continue;
      }
    }
    
    throw new Error(`Location with ID ${locationId} not found`);
  } catch (error) {
    console.error(`Error deleting location ${locationId}:`, error);
    throw error;
  }
}

/**
 * Gets a single location by ID
 * Scans all files in the directory since files are named by location name
 * 
 * @param locationId - Location ID to find
 * @returns Location object or null if not found
 */
export async function getLocationById(locationId: string): Promise<Location | null> {
  try {
    await fs.access(LOCATIONS_DIR);
  } catch {
    return null;
  }
  
  try {
    const files = await fs.readdir(LOCATIONS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const filePath = path.join(LOCATIONS_DIR, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const location: Location = JSON.parse(fileContent);
        
        if (location.id === locationId) {
          return location;
        }
      } catch (error) {
        console.error(`Error reading location file ${filePath}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error reading locations directory:`, error);
  }
  
  return null;
}

/**
 * SHIFTS FILE SYSTEM STORAGE
 * Files are stored as: data/shifts/{shiftId}.json
 */

const SHIFTS_DIR = path.join(process.cwd(), 'data', 'shifts');
const ORDERS_DIR = path.join(process.cwd(), 'data', 'orders');

/**
 * Saves a shift to a JSON file in the file system
 * Path structure: data/shifts/{shiftId}.json
 */
export async function saveShift(shift: any): Promise<void> {
  await ensureDirectoryExists(SHIFTS_DIR);
  
  const filename = `${shift.id}.json`;
  const filePath = path.join(SHIFTS_DIR, filename);
  
  const shiftData = JSON.stringify(shift, null, 2);
  await fs.writeFile(filePath, shiftData, 'utf-8');
}

/**
 * ORDERS FILE SYSTEM STORAGE
 * Files are stored as: data/orders/{orderId}.json
 */

/**
 * Saves an order to a JSON file in the file system
 * Path structure: data/orders/{orderId}.json
 */
export async function saveOrder(order: Order): Promise<void> {
  await ensureDirectoryExists(ORDERS_DIR);
  
  const filename = `${order.id}.json`;
  const filePath = path.join(ORDERS_DIR, filename);
  
  const orderData = JSON.stringify(order, null, 2);
  await fs.writeFile(filePath, orderData, 'utf-8');
}

/**
 * Gets all shifts for a specific location
 * Scans the shifts directory and filters by locationId
 * 
 * @param locationId - Location ID to filter shifts (optional, if not provided returns all)
 * @returns Array of Shift objects
 */
export async function getShifts(locationId?: string): Promise<any[]> {
  try {
    await fs.access(SHIFTS_DIR);
  } catch {
    // Directory doesn't exist, return empty array
    return [];
  }
  
  try {
    const files = await fs.readdir(SHIFTS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const shifts: any[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(SHIFTS_DIR, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const shift: any = JSON.parse(fileContent);
        
        // Filter by locationId if provided
        if (!locationId || shift.locationId === locationId) {
          shifts.push(shift);
        }
      } catch (error) {
        console.error(`Error reading shift file ${filePath}:`, error);
        continue;
      }
    }
    
    return shifts;
  } catch (error) {
    console.error(`Error reading shifts directory ${SHIFTS_DIR}:`, error);
    return [];
  }
}

/**
 * Gets active shift for an employee
 * Единый критерий активной смены: employee_id = employeeId AND status = 'active' AND ended_at IS NULL
 * В текущей структуре: status = 'active' AND clockOut IS NULL/отсутствует
 * @param employeeId - Employee ID
 * @param locationId - Optional location ID to filter by
 * @returns Active shift object or null if not found
 */
export async function getActiveShift(employeeId: string, locationId?: string): Promise<any | null> {
  try {
    const shifts = await getShifts(locationId);
    
    // Find active shift for this employee using unified criteria:
    // employee_id = employeeId AND status = 'active' AND ended_at IS NULL (clockOut IS NULL)
    const activeShift = shifts.find(shift => 
      shift.employeeId === employeeId && 
      shift.status === 'active' &&
      (shift.clockOut === null || shift.clockOut === undefined || !shift.clockOut)
    );
    
    return activeShift || null;
  } catch (error) {
    console.error(`Error getting active shift for employee ${employeeId}:`, error);
    return null;
  }
}

/**
 * Deletes a user file from the file system
 * Scans all files in the role directory to find the file with matching user ID
 * 
 * @param userId - User ID to delete
 * @param role - User role (director, manager, employee)
 */
export async function deleteUserFile(userId: string, role: Role): Promise<void> {
  const roleDir = path.join(BASE_DIR, role);
  
  // Check if directory exists
  try {
    await fs.access(roleDir);
  } catch {
    throw new Error(`Directory does not exist: ${roleDir}`);
  }
  
  try {
    // Read all files in the role directory
    const files = await fs.readdir(roleDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // Find the file containing the user with matching ID
    for (const file of jsonFiles) {
      const filePath = path.join(roleDir, file);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const user: User = JSON.parse(fileContent);
        
        if (user.id === userId) {
          // Found the user file - delete it
          fsSync.unlinkSync(filePath);
          console.log(`[deleteUserFile] Deleted user file: ${filePath}`);
          return;
        }
      } catch (error) {
        console.error(`[deleteUserFile] Error reading file ${filePath}:`, error);
        continue;
      }
    }
    
    throw new Error(`User with ID ${userId} not found in ${role} directory`);
  } catch (error) {
    console.error(`[deleteUserFile] Error deleting user ${userId}:`, error);
    throw error;
  }
}

/**
 * Gets all data for a user (user, locations, employees, shifts)
 * Used for synchronization
 * 
 * @param userId - User ID
 * @param role - User role
 * @returns Object with user data, locations, employees, and shifts
 */
export async function getUserData(userId: string, role: Role): Promise<{
  user: User | null;
  locations: Location[];
  employees: User[];
  shifts: any[];
}> {
  // 1. Load User
  let user: User | null = null;
  const roleDir = path.join(BASE_DIR, role);
  
  try {
    await fs.access(roleDir);
    const files = await fs.readdir(roleDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    for (const file of jsonFiles) {
      const filePath = path.join(roleDir, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const foundUser: User = JSON.parse(fileContent);
        if (foundUser.id === userId) {
          user = foundUser;
          break;
        }
      } catch (error) {
        console.error(`Error reading user file ${filePath}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error reading user directory:`, error);
  }
  
  if (!user) {
    return { user: null, locations: [], employees: [], shifts: [] };
  }
  
  // 2. Load Locations (for directors/managers)
  const businessId = user.businessId || user.id;
  const locations = await getLocations(businessId);
  
  // 3. Load Employees (for directors)
  const employees: User[] = [];
  if (role === 'director') {
    try {
      const employeeDir = path.join(BASE_DIR, 'employee');
      const managerDir = path.join(BASE_DIR, 'manager');
      
      // Load employees
      try {
        await fs.access(employeeDir);
        const empFiles = await fs.readdir(employeeDir);
        const empJsonFiles = empFiles.filter(file => file.endsWith('.json'));
        
        for (const file of empJsonFiles) {
          const filePath = path.join(employeeDir, file);
          try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const emp: User = JSON.parse(fileContent);
            if (emp.businessId === businessId) {
              employees.push(emp);
            }
          } catch (error) {
            console.error(`Error reading employee file ${filePath}:`, error);
            continue;
          }
        }
      } catch (error) {
        console.error(`Error reading employee directory:`, error);
      }
      
      // Load managers
      try {
        await fs.access(managerDir);
        const mgrFiles = await fs.readdir(managerDir);
        const mgrJsonFiles = mgrFiles.filter(file => file.endsWith('.json'));
        
        for (const file of mgrJsonFiles) {
          const filePath = path.join(managerDir, file);
          try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const mgr: User = JSON.parse(fileContent);
            if (mgr.businessId === businessId) {
              employees.push(mgr);
            }
          } catch (error) {
            console.error(`Error reading manager file ${filePath}:`, error);
            continue;
          }
        }
      } catch (error) {
        console.error(`Error reading manager directory:`, error);
      }
    } catch (error) {
      console.error(`Error loading employees:`, error);
    }
  }
  
  // 4. Load Shifts (for all locations of this business)
  const shifts: any[] = [];
  for (const location of locations) {
    const locationShifts = await getShifts(location.id);
    shifts.push(...locationShifts);
  }
  
  return { user, locations, employees, shifts };
}

/**
 * Unified Search Engine: Finds entity by access code (16-digit code)
 * Scans BOTH directors (companyCode) and locations (accessCode)
 * 
 * @param code - 16-digit access code (with or without dashes)
 * @returns Entity object with type, id, name, and related IDs, or null if not found
 */
export async function findEntityByAccessCode(code: string): Promise<{
  type: 'business' | 'location';
  id: string;
  name: string;
  businessId?: string;
  ownerId?: string;
} | null> {
  // Normalize code (remove dashes, lowercase, trim)
  const normalizedCode = code.replace(/-/g, '').toLowerCase().trim();
  
  console.log(`[findEntityByAccessCode] Searching for code: "${code}" (normalized: "${normalizedCode}")`);
  
  // Step 1: Scan Directors (Business Level)
  const directorDir = path.join(BASE_DIR, 'director');
  
  try {
    await fs.access(directorDir);
    const directorFiles = await fs.readdir(directorDir);
    const directorJsonFiles = directorFiles.filter(file => file.endsWith('.json'));
    
    console.log(`[findEntityByAccessCode] Scanning ${directorJsonFiles.length} director files for companyCode`);
    
    for (const dirFile of directorJsonFiles) {
      const dirFilePath = path.join(directorDir, dirFile);
      try {
        const dirContent = await fs.readFile(dirFilePath, 'utf-8');
        const director: User = JSON.parse(dirContent);
        
        // Normalize company codes for comparison
        const normalizedDirectorCode = (director.companyCode || '').replace(/-/g, '').toLowerCase().trim();
        
        if (normalizedDirectorCode === normalizedCode) {
          const result = {
            type: 'business' as const,
            id: director.businessId || director.id,
            name: director.fullName || director.name || 'Business',
            ownerId: director.id,
          };
          console.log(`[findEntityByAccessCode] Found director with companyCode: ${director.companyCode}, businessId: ${result.id}`);
          return result;
        }
      } catch (error) {
        console.error(`[findEntityByAccessCode] Error reading director file ${dirFilePath}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.log(`[findEntityByAccessCode] Director directory does not exist or error accessing: ${directorDir}`);
  }
  
  // Step 2: Scan Locations (Point Level)
  try {
    await fs.access(LOCATIONS_DIR);
    const locationFiles = await fs.readdir(LOCATIONS_DIR);
    const locationJsonFiles = locationFiles.filter(file => file.endsWith('.json'));
    
    console.log(`[findEntityByAccessCode] Scanning ${locationJsonFiles.length} location files for accessCode`);
    
    for (const locFile of locationJsonFiles) {
      const locFilePath = path.join(LOCATIONS_DIR, locFile);
      try {
        const locContent = await fs.readFile(locFilePath, 'utf-8');
        const location: Location = JSON.parse(locContent);
        
        // Normalize access codes for comparison
        const normalizedLocationCode = (location.accessCode || '').replace(/-/g, '').toLowerCase().trim();
        
        if (normalizedLocationCode === normalizedCode) {
          const result = {
            type: 'location' as const,
            id: location.id,
            name: location.name || 'Location',
            businessId: location.businessId,
          };
          console.log(`[findEntityByAccessCode] Found location with accessCode: ${location.accessCode}, locationId: ${result.id}, businessId: ${result.businessId}`);
          return result;
        }
      } catch (error) {
        console.error(`[findEntityByAccessCode] Error reading location file ${locFilePath}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.log(`[findEntityByAccessCode] Locations directory does not exist or error accessing: ${LOCATIONS_DIR}`);
  }
  
  // Step 3: Return null if nothing matches
  console.log(`[findEntityByAccessCode] No entity found with code: "${code}"`);
  return null;
}

