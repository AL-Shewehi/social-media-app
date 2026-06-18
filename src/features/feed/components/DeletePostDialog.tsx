import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeletePostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isDeleting: boolean;
    onConfirm: () => void;
}

export default function DeletePostDialog({ open, onOpenChange, isDeleting, onConfirm }: DeletePostDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-right">هل أنت متأكد من حذف المنشور؟</AlertDialogTitle>
                    <AlertDialogDescription className="text-right">
                        هذا الإجراء لا يمكن التراجع عنه وسيتم تنظيف كافة الملفات التابعة للمنشور.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2 mt-4">
                    <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }} 
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "جاري الحذف..." : "حذف المنشور"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}