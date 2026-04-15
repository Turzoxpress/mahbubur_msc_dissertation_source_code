package com.mahbubur.restcompare.api;

public final class ApiEndpoints {
    private ApiEndpoints() {}

    public static final String API_BASE = "/api";

    public static final String PING = API_BASE + "/ping";
    public static final String STATS = API_BASE + "/stats";

    public static final String BOOKS = API_BASE + "/books";
    public static final String BOOKS_AVAILABLE = "/available";
    public static final String BOOKS_SEARCH = "/search";
    public static final String BOOKS_BY_ISBN = "/isbn/{isbn}";
    public static final String BOOK_BY_ID = "/{id}";
    public static final String BOOKS_BULK = "/bulk";
    public static final String BOOK_STOCK = "/{id}/stock";

    public static final String MEMBERS = API_BASE + "/members";
    public static final String MEMBERS_SEARCH = "/search";
    public static final String MEMBER_BY_MEMBERSHIP = "/membership/{membershipNo}";
    public static final String MEMBER_BY_ID = "/{id}";

    public static final String LOANS = API_BASE + "/loans";
    public static final String LOANS_ACTIVE = "/active";
    public static final String LOANS_OVERDUE = "/overdue";
    public static final String LOANS_EXPANDED = "/expanded";
    public static final String LOAN_EXPANDED_BY_ID = "/expanded/{id}";
    public static final String LOAN_BY_ID = "/{id}";
    public static final String LOAN_CHECKOUT = "/checkout";
    public static final String LOAN_RETURN = "/{id}/return";
    public static final String LOAN_RENEW = "/{id}/renew";
}
