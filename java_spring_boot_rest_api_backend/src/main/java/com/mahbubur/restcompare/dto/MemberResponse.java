package com.mahbubur.restcompare.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MemberResponse {
    private Long id;
    private String membershipNo;
    private String fullName;
    private String email;
    private LocalDate joinedAt;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMembershipNo() { return membershipNo; }
    public void setMembershipNo(String membershipNo) { this.membershipNo = membershipNo; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDate getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDate joinedAt) { this.joinedAt = joinedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
