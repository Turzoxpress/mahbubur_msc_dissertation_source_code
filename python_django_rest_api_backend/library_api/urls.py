from django.urls import path

from .views import (
    # utility
    PingAPIView,
    StatsAPIView,
    # core CRUD
    BookListCreateAPIView,
    BookDetailAPIView,
    MemberListCreateAPIView,
    MemberDetailAPIView,
    LoanListCreateAPIView,
    LoanDetailAPIView,
    # book extra
    BookSearchAPIView,
    BookByIsbnAPIView,
    BookAvailableAPIView,
    BookBulkCreateAPIView,
    BookStockUpdateAPIView,
    # member extra
    MemberSearchAPIView,
    MemberByMembershipAPIView,
    # loan operations
    LoanCheckoutAPIView,
    LoanReturnAPIView,
    LoanRenewAPIView,
    LoanActiveAPIView,
    LoanOverdueAPIView,
    # expanded
    LoanExpandedListAPIView,
    LoanExpandedDetailAPIView,
)

urlpatterns = [
    # Utility
    path("ping", PingAPIView.as_view(), name="ping"),
    path("stats", StatsAPIView.as_view(), name="stats"),

    # Books
    path("books", BookListCreateAPIView.as_view(), name="book-list-create"),
    path("books/search", BookSearchAPIView.as_view(), name="book-search"),
    path("books/available", BookAvailableAPIView.as_view(), name="book-available"),
    path("books/bulk", BookBulkCreateAPIView.as_view(), name="book-bulk-create"),
    path("books/isbn/<str:isbn>", BookByIsbnAPIView.as_view(), name="book-by-isbn"),
    path("books/<int:book_id>/stock", BookStockUpdateAPIView.as_view(), name="book-stock-update"),
    path("books/<int:book_id>", BookDetailAPIView.as_view(), name="book-detail"),

    # Members
    path("members", MemberListCreateAPIView.as_view(), name="member-list-create"),
    path("members/search", MemberSearchAPIView.as_view(), name="member-search"),
    path("members/membership/<str:membership_no>", MemberByMembershipAPIView.as_view(), name="member-by-membership"),
    path("members/<int:member_id>", MemberDetailAPIView.as_view(), name="member-detail"),

    # Loans
    path("loans", LoanListCreateAPIView.as_view(), name="loan-list-create"),
    path("loans/checkout", LoanCheckoutAPIView.as_view(), name="loan-checkout"),
    path("loans/active", LoanActiveAPIView.as_view(), name="loan-active"),
    path("loans/overdue", LoanOverdueAPIView.as_view(), name="loan-overdue"),
    path("loans/expanded", LoanExpandedListAPIView.as_view(), name="loan-expanded-list"),
    path("loans/expanded/<int:loan_id>", LoanExpandedDetailAPIView.as_view(), name="loan-expanded-detail"),
    path("loans/<int:loan_id>/return", LoanReturnAPIView.as_view(), name="loan-return"),
    path("loans/<int:loan_id>/renew", LoanRenewAPIView.as_view(), name="loan-renew"),
    path("loans/<int:loan_id>", LoanDetailAPIView.as_view(), name="loan-detail"),
]
