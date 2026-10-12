package edu.campus.lostfound.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "collection_hubs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionHub {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true, length = 24)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 120)
    private String building;

    @Column(name = "room_location", nullable = false, length = 120)
    private String roomLocation;

    @Column(name = "operating_hours", nullable = false, length = 100)
    private String operatingHours;

    @Column(name = "duty_officer", nullable = false, length = 100)
    private String dutyOfficer;

    @Column(name = "contact_ext", nullable = false, length = 32)
    private String contactExt;

    @Column(name = "total_bins", nullable = false)
    private int totalBins;

    @Column(name = "occupied_bins", nullable = false)
    private int occupiedBins;
}
