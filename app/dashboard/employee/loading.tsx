export default function Loading() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}





