package com.mahbubur.restcompare.model.dto;

import java.time.Instant;

public class StatsResponse {

    private long totalBooks;
    private long availableBooks;
    private long totalMembers;
    private long totalLoans;

    private long activeLoans;
    private long returnedLoans;
    private long overdueLoans;

    private Instant timestamp;

    public long getTotalBooks() { return totalBooks; }
    public void setTotalBooks(long totalBooks) { this.totalBooks = totalBooks; }

    public long getAvailableBooks() { return availableBooks; }
    public void setAvailableBooks(long availableBooks) { this.availableBooks = availableBooks; }

    public long getTotalMembers() { return totalMembers; }
    public void setTotalMembers(long totalMembers) { this.totalMembers = totalMembers; }

    public long getTotalLoans() { return totalLoans; }
    public void setTotalLoans(long totalLoans) { this.totalLoans = totalLoans; }

    public long getActiveLoans() { return activeLoans; }
    public void setActiveLoans(long activeLoans) { this.activeLoans = activeLoans; }

    public long getReturnedLoans() { return returnedLoans; }
    public void setReturnedLoans(long returnedLoans) { this.returnedLoans = returnedLoans; }

    public long getOverdueLoans() { return overdueLoans; }
    public void setOverdueLoans(long overdueLoans) { this.overdueLoans = overdueLoans; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
