package edu.campus.lostfound.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "recipient_user_id", nullable = false, length = 36)
    private String recipientUserId;

    @Column(name = "recipient_role", nullable = false, length = 32)
    private String recipientRole;

    @Column(nullable = false, length = 160)
    private String title;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(name = "related_item_id", length = 36)
    private String relatedItemId;

    @Column(name = "action_code", length = 32)
    private String actionCode;

    @JsonProperty("isRead")
    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
