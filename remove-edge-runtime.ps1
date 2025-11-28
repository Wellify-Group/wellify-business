# Script to remove export const runtime = 'nodejs'; from routes that use @/lib/db*
$routes = @(
    "app\api\auth\login\route.ts",
    "app\api\auth\register\route.ts",
    "app\api\auth\verify-code\route.ts",
    "app\api\employee\shifts\active\route.ts",
    "app\api\employee\shifts\start\route.ts",
    "app\api\employee\shifts\[shiftId]\close\route.ts",
    "app\api\ingredients\route.ts",
    "app\api\ingredients\movements\route.ts",
    "app\api\ingredients\product-components\route.ts",
    "app\api\ingredients\stock-levels\route.ts",
    "app\api\locations\create\route.ts",
    "app\api\locations\delete\route.ts",
    "app\api\locations\list\route.ts",
    "app\api\locations\update\route.ts",
    "app\api\orders\route.ts",
    "app\api\shift\[shiftId]\close\route.ts",
    "app\api\shift\[shiftId]\stats\route.ts",
    "app\api\shift-events\route.ts",
    "app\api\shift-events\checklist-task\route.ts",
    "app\api\shift-events\problem\route.ts",
    "app\api\shift-report\[shiftId]\route.ts",
    "app\api\shifts\route.ts",
    "app\api\shifts\close\route.ts",
    "app\api\shifts\[shiftId]\messages\route.ts",
    "app\api\shifts\[shiftId]\metrics\route.ts",
    "app\api\shifts\[shiftId]\tasks\route.ts",
    "app\api\shifts\[shiftId]\tasks\[taskId]\route.ts",
    "app\api\shifts\[shiftId]\tasks\stats\route.ts",
    "app\api\sync\route.ts",
    "app\api\user\create\route.ts",
    "app\api\user\delete\route.ts",
    "app\api\user\update\route.ts",
    "app\api\user-settings\route.ts"
)

foreach ($route in $routes) {
    if (Test-Path $route) {
        $content = Get-Content $route -Raw
        $content = $content -replace "export const runtime = 'nodejs';", "// Note: Uses @/lib/db* which requires Node.js fs/path - cannot use Edge Runtime`n// export const runtime = 'nodejs';"
        Set-Content $route -Value $content -NoNewline
        Write-Host "Updated: $route"
    }
}


