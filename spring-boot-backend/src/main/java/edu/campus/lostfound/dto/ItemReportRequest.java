package edu.campus.lostfound.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ItemReportRequest {

    @NotBlank(message = "Item title is required")
    @Size(min = 4, max = 140, message = "Title must be between 4 and 140 characters")
    private String title;

    @NotNull(message = "Report type (LOST or FOUND) is required")
    @Pattern(regexp = "LOST|FOUND", message = "Type must be LOST or FOUND")
    private String type;

    @NotBlank(message = "Category selection is required")
    private String category;

    @NotBlank(message = "Campus building or zone is required")
    private String campusZone;

    @NotBlank(message = "Specific room or landmark location is required")
    @Size(min = 3, max = 160, message = "Specific location must be between 3 and 160 characters")
    private String specificLocation;

    @NotBlank(message = "Date and approximate time of incident is required")
    private String dateOccurred;

    @NotBlank(message = "Detailed item description is required")
    @Size(min = 12, max = 1000, message = "Description must contain at least 12 characters")
    private String description;

    @Size(max = 255, message = "Distinguishing features must be under 255 characters")
    private String distinguishingFeatures;

    @NotBlank(message = "Ownership verification challenge question is required")
    @Size(min = 8, max = 255, message = "Verification challenge question must be at least 8 characters")
    private String verificationQuestion;

    private String expectedVerificationHint;
    private String hubId;
    private String lockerBin;
    private String imageUrl;

    public ItemReportRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getCampusZone() { return campusZone; }
    public void setCampusZone(String campusZone) { this.campusZone = campusZone; }

    public String getSpecificLocation() { return specificLocation; }
    public void setSpecificLocation(String specificLocation) { this.specificLocation = specificLocation; }

    public String getDateOccurred() { return dateOccurred; }
    public void setDateOccurred(String dateOccurred) { this.dateOccurred = dateOccurred; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDistinguishingFeatures() { return distinguishingFeatures; }
    public void setDistinguishingFeatures(String distinguishingFeatures) { this.distinguishingFeatures = distinguishingFeatures; }

    public String getVerificationQuestion() { return verificationQuestion; }
    public void setVerificationQuestion(String verificationQuestion) { this.verificationQuestion = verificationQuestion; }

    public String getExpectedVerificationHint() { return expectedVerificationHint; }
    public void setExpectedVerificationHint(String expectedVerificationHint) { this.expectedVerificationHint = expectedVerificationHint; }

    public String getHubId() { return hubId; }
    public void setHubId(String hubId) { this.hubId = hubId; }

    public String getLockerBin() { return lockerBin; }
    public void setLockerBin(String lockerBin) { this.lockerBin = lockerBin; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
