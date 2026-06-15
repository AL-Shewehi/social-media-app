export async function withErrorHandling<T>(
    action: () => Promise<T>,
    errorMessage: string
) {
    try {
        const data = await action();
        return { success: true, data };
    } catch (error: unknown) {
        console.error(`[Action Error] ${errorMessage}:`, 
            error instanceof Error ? error : JSON.stringify(error, null, 2)
        );
        
        return { 
            success: false, 
            error: error instanceof Error ? error.message : errorMessage 
        };
    }
}