from django.utils import timezone

from library_api.models import Book, Loan, Member


class StatsService:
    @staticmethod
    def get_stats():
        return {
            "total_books": Book.objects.count(),
            "available_books": Book.objects.filter(available_copies__gt=0).count(),
            "total_members": Member.objects.count(),
            "total_loans": Loan.objects.count(),
            "active_loans": Loan.objects.filter(status=Loan.LoanStatus.ACTIVE, returned_date__isnull=True).count(),
            "returned_loans": Loan.objects.filter(status=Loan.LoanStatus.RETURNED).count(),
            "overdue_loans": Loan.objects.filter(status=Loan.LoanStatus.OVERDUE, returned_date__isnull=True).count(),
            "timestamp": timezone.now().isoformat(),
        }
