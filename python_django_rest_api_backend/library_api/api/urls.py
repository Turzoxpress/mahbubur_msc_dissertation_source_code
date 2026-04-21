from django.urls import path

from library_api.api import endpoints
from library_api.controllers import (
    BookAvailableController,
    BookBulkCreateController,
    BookByIsbnController,
    BookDetailController,
    BookListCreateController,
    BookSearchController,
    BookStockUpdateController,
    LoanActiveController,
    LoanCheckoutController,
    LoanDetailController,
    LoanExpandedDetailController,
    LoanExpandedListController,
    LoanListCreateController,
    LoanOverdueController,
    LoanRenewController,
    LoanReturnController,
    MemberByMembershipController,
    MemberDetailController,
    MemberListCreateController,
    MemberSearchController,
    PingController,
    StatsController,
)

urlpatterns = [
    path(endpoints.PING, PingController.as_view(), name="ping"),
    path(endpoints.STATS, StatsController.as_view(), name="stats"),

    path(endpoints.BOOKS, BookListCreateController.as_view(), name="book-list-create"),
    path(endpoints.BOOKS_SEARCH, BookSearchController.as_view(), name="book-search"),
    path(endpoints.BOOKS_AVAILABLE, BookAvailableController.as_view(), name="book-available"),
    path(endpoints.BOOKS_BULK, BookBulkCreateController.as_view(), name="book-bulk-create"),
    path(endpoints.BOOKS_BY_ISBN, BookByIsbnController.as_view(), name="book-by-isbn"),
    path(endpoints.BOOK_STOCK, BookStockUpdateController.as_view(), name="book-stock-update"),
    path(endpoints.BOOK_BY_ID, BookDetailController.as_view(), name="book-detail"),

    path(endpoints.MEMBERS, MemberListCreateController.as_view(), name="member-list-create"),
    path(endpoints.MEMBERS_SEARCH, MemberSearchController.as_view(), name="member-search"),
    path(endpoints.MEMBER_BY_MEMBERSHIP, MemberByMembershipController.as_view(), name="member-by-membership"),
    path(endpoints.MEMBER_BY_ID, MemberDetailController.as_view(), name="member-detail"),

    path(endpoints.LOANS, LoanListCreateController.as_view(), name="loan-list-create"),
    path(endpoints.LOAN_CHECKOUT, LoanCheckoutController.as_view(), name="loan-checkout"),
    path(endpoints.LOAN_ACTIVE, LoanActiveController.as_view(), name="loan-active"),
    path(endpoints.LOAN_OVERDUE, LoanOverdueController.as_view(), name="loan-overdue"),
    path(endpoints.LOAN_EXPANDED, LoanExpandedListController.as_view(), name="loan-expanded-list"),
    path(endpoints.LOAN_EXPANDED_DETAIL, LoanExpandedDetailController.as_view(), name="loan-expanded-detail"),
    path(endpoints.LOAN_RETURN, LoanReturnController.as_view(), name="loan-return"),
    path(endpoints.LOAN_RENEW, LoanRenewController.as_view(), name="loan-renew"),
    path(endpoints.LOAN_BY_ID, LoanDetailController.as_view(), name="loan-detail"),
]
