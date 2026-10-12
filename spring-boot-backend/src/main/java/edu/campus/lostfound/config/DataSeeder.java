package edu.campus.lostfound.config;

import edu.campus.lostfound.entity.CollectionHub;
import edu.campus.lostfound.entity.ItemReport;
import edu.campus.lostfound.entity.Notification;
import edu.campus.lostfound.entity.OwnershipClaim;
import edu.campus.lostfound.entity.User;
import edu.campus.lostfound.repository.CollectionHubRepository;
import edu.campus.lostfound.repository.ItemReportRepository;
import edu.campus.lostfound.repository.NotificationRepository;
import edu.campus.lostfound.repository.OwnershipClaimRepository;
import edu.campus.lostfound.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CollectionHubRepository hubRepository;
    private final ItemReportRepository itemRepository;
    private final OwnershipClaimRepository claimRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User owner = User.builder()
                    .id("usr-owner-01")
                    .fullName("Maya Lin")
                    .email("maya.lin@campus.edu")
                    .passwordHash(passwordEncoder.encode("Campus2026!"))
                    .campusId("STU-2026-4819")
                    .department("B.S. Computer Science & Engineering")
                    .phone("+1 (555) 234-8819")
                    .role("OWNER")
                    .verified(true)
                    .createdAt(Instant.parse("2026-10-01T08:15:00Z"))
                    .build();

            User finder = User.builder()
                    .id("usr-finder-02")
                    .fullName("Liam Vance")
                    .email("liam.vance@campus.edu")
                    .passwordHash(passwordEncoder.encode("Campus2026!"))
                    .campusId("STU-2026-9104")
                    .department("M.S. Mechanical & Robotics Lab")
                    .phone("+1 (555) 390-1142")
                    .role("FINDER")
                    .verified(true)
                    .createdAt(Instant.parse("2026-10-01T09:00:00Z"))
                    .build();

            User admin = User.builder()
                    .id("usr-admin-03")
                    .fullName("Sgt. Marcus Thorne")
                    .email("sec.thorne@campus.edu")
                    .passwordHash(passwordEncoder.encode("Security2026!"))
                    .campusId("SEC-0104")
                    .department("Campus Safety & Custody Division")
                    .phone("+1 (555) 800-9110")
                    .role("ADMIN_SECURITY")
                    .verified(true)
                    .createdAt(Instant.parse("2026-09-15T07:00:00Z"))
                    .build();

            userRepository.saveAll(List.of(owner, finder, admin));
        }

        if (hubRepository.count() == 0) {
            CollectionHub h1 = new CollectionHub("hub-sec-01", "HUB-SEC-01", "Security Desk 1",
                    "Main Gate & A–D Blocks Security Kiosk", "Ground Floor Main Entrance, Desk 1",
                    "Mon–Sun · 07:00 – 22:00", "Officer S. Patel", "Ext. 4101", 25, 9);
            CollectionHub h2 = new CollectionHub("hub-sec-02", "HUB-SEC-02", "Security Desk 2",
                    "E–H Blocks & Library Security Kiosk", "North Concourse Security Post, Desk 2",
                    "Mon–Sun · 07:30 – 21:30", "Officer D. Kowalski", "Ext. 4102", 25, 8);
            CollectionHub h3 = new CollectionHub("hub-adm-03", "HUB-ADM-03", "Administration Block",
                    "Central Administration Block", "Ground Floor Custody & Verification Office, Room 102",
                    "Mon–Sat · 08:00 – 20:00", "Sgt. Marcus Thorne", "Ext. 4200", 30, 12);

            hubRepository.saveAll(List.of(h1, h2, h3));
        }

        if (itemRepository.count() == 0) {
            ItemReport item1 = ItemReport.builder()
                    .id("itm-101")
                    .referenceCode("LF-2026-101")
                    .title("14-inch MacBook Pro (Space Black)")
                    .type("LOST")
                    .category("Electronics")
                    .campusZone("Library")
                    .specificLocation("3rd Floor Quiet Reading Room, Oak Table 12")
                    .dateOccurred("2026-10-09 16:40")
                    .description("Space Black Apple MacBook Pro 14-inch (M3 Pro). Left briefly on the reading table near the Gothic bay windows while retrieving a reference volume.")
                    .distinguishingFeatures("Small matte silver IEEE Robotics decal on the bottom-left palm rest; hardshell clear bottom cover.")
                    .verificationQuestion("What are the last 4 characters of the serial number or the lock-screen user account name?")
                    .expectedVerificationHint("Serial ends in Q8X4, account name mlin-dev")
                    .custodyStatus("REPORTED")
                    .hubId("hub-sec-01")
                    .hubName("Security Desk 1")
                    .imageUrl("/images/item_macbook_pro.jpg")
                    .reportedByUserId("usr-owner-01")
                    .reportedByName("Maya Lin")
                    .reportedByCampusId("STU-2026-4819")
                    .reportedByRole("OWNER")
                    .createdAt(Instant.parse("2026-10-09T17:15:00Z"))
                    .build();

            ItemReport item2 = ItemReport.builder()
                    .id("itm-102")
                    .referenceCode("LF-2026-102")
                    .title("AirPods Pro (2nd Gen) on Navy Lanyard with Brass Keys")
                    .type("FOUND")
                    .category("Electronics")
                    .campusZone("A Block")
                    .specificLocation("Concrete bench outside Engineering Hall North Entrance")
                    .dateOccurred("2026-10-09 14:20")
                    .description("Found white AirPods Pro USB-C charging case clipped to a woven navy blue neck lanyard with two brass dorm keys stamped with a room number.")
                    .distinguishingFeatures("Brass key stamped with 3-digit number; faint engraving on the back hinge of the charging case.")
                    .verificationQuestion("What is the 3-digit number stamped on the main brass key and the custom Bluetooth device name?")
                    .expectedVerificationHint("Key stamped 402; Bluetooth name Maya-AirPods")
                    .custodyStatus("IN_CUSTODY")
                    .hubId("hub-sec-02")
                    .hubName("Security Desk 2")
                    .lockerBin("Bin S2-07")
                    .submissionReceiptCode("SUB-2026-7841")
                    .imageUrl("/images/item_airpods_case.jpg")
                    .reportedByUserId("usr-finder-02")
                    .reportedByName("Liam Vance")
                    .reportedByCampusId("STU-2026-9104")
                    .reportedByRole("FINDER")
                    .createdAt(Instant.parse("2026-10-09T14:55:00Z"))
                    .build();

            ItemReport item3 = ItemReport.builder()
                    .id("itm-103")
                    .referenceCode("LF-2026-103")
                    .title("TI-84 Plus CE Python Graphing Calculator & ME-301 Lab Book")
                    .type("FOUND")
                    .category("Textbooks & Lab Gear")
                    .campusZone("E Block")
                    .specificLocation("Room E-214 Structural Mechanics Lab, Bench 4")
                    .dateOccurred("2026-10-08 18:10")
                    .description("Matte black TI-84 Plus CE Python Edition graphing calculator found alongside a spiral-bound Engineering Laboratory Notebook containing beam deflection tables.")
                    .distinguishingFeatures("Slide cover has a white property barcode sticker inside; lab notebook has handwritten Lab 4 notes in blue ink.")
                    .verificationQuestion("Whose student ID number or full name is written inside the back slide cover of the calculator?")
                    .expectedVerificationHint("Maya Lin / STU-2026-4819")
                    .custodyStatus("CLAIM_APPROVED")
                    .hubId("hub-adm-03")
                    .hubName("Administration Block")
                    .lockerBin("Bin ADM-19")
                    .submissionReceiptCode("SUB-2026-6390")
                    .imageUrl("/images/item_graphing_calc.jpg")
                    .reportedByUserId("usr-finder-02")
                    .reportedByName("Liam Vance")
                    .reportedByCampusId("STU-2026-9104")
                    .reportedByRole("FINDER")
                    .createdAt(Instant.parse("2026-10-08T18:45:00Z"))
                    .build();

            ItemReport item4 = ItemReport.builder()
                    .id("itm-104")
                    .referenceCode("LF-2026-104")
                    .title("Cognac Leather Cardholder Wallet & Residence Key Fob")
                    .type("FOUND")
                    .category("Campus ID & Keys")
                    .campusZone("Canteen")
                    .specificLocation("Founders Commons Espresso Bar Counter")
                    .dateOccurred("2026-10-10 09:15")
                    .description("Stitched cognac brown leather minimalist wallet with a matching leather keychain, two Yale keys, brass tag 2B, and an encrypted black residence hall proximity fob.")
                    .distinguishingFeatures("Contains University ID card, blue transit pass, and brass tag engraved 2B.")
                    .verificationQuestion("What is the full 8-digit Campus ID number printed on the enclosed student card and the issuing bank on the debit card?")
                    .expectedVerificationHint("STU-2026-4819, Metro Federal Credit Union")
                    .custodyStatus("IN_CUSTODY")
                    .hubId("hub-adm-03")
                    .hubName("Administration Block")
                    .lockerBin("Bin ADM-04")
                    .submissionReceiptCode("SUB-2026-9102")
                    .imageUrl("/images/item_leather_wallet.jpg")
                    .reportedByUserId("usr-admin-03")
                    .reportedByName("Sgt. Marcus Thorne")
                    .reportedByCampusId("SEC-0104")
                    .reportedByRole("ADMIN_SECURITY")
                    .createdAt(Instant.parse("2026-10-10T09:30:00Z"))
                    .build();

            ItemReport item5 = ItemReport.builder()
                    .id("itm-105")
                    .referenceCode("LF-2026-105")
                    .title("Oak & Pine 24oz Sage Green Insulated Flask")
                    .type("FOUND")
                    .category("Personal Accessories")
                    .campusZone("C Block")
                    .specificLocation("Varsity Café Seating Area near Court 2")
                    .dateOccurred("2026-10-06 11:30")
                    .description("24oz sage green powder-coated stainless steel bottle with black loop cap. Submitted to Security Desk 1 and returned after verification.")
                    .distinguishingFeatures("Laser-etched Oak & Pine logo near base; small scuff on the black loop handle.")
                    .verificationQuestion("What color silicone boot or name label was attached to the bottom before cleaning?")
                    .expectedVerificationHint("Charcoal silicone ring with initials M.L.")
                    .custodyStatus("RETURNED")
                    .hubId("hub-sec-01")
                    .hubName("Security Desk 1")
                    .lockerBin("Bin S1-02")
                    .submissionReceiptCode("SUB-2026-5120")
                    .imageUrl("/images/item_insulated_bottle.jpg")
                    .reportedByUserId("usr-finder-02")
                    .reportedByName("Liam Vance")
                    .reportedByCampusId("STU-2026-9104")
                    .reportedByRole("FINDER")
                    .createdAt(Instant.parse("2026-10-06T12:00:00Z"))
                    .build();

            itemRepository.saveAll(List.of(item1, item2, item3, item4, item5));

            OwnershipClaim claim1 = OwnershipClaim.builder()
                    .id("clm-301")
                    .claimCode("CLM-2026-301")
                    .itemId("itm-102")
                    .itemReferenceCode("LF-2026-102")
                    .itemTitle("AirPods Pro (2nd Gen) on Navy Lanyard with Brass Keys")
                    .itemType("FOUND")
                    .claimantUserId("usr-owner-01")
                    .claimantName("Maya Lin")
                    .claimantEmail("maya.lin@campus.edu")
                    .claimantCampusId("STU-2026-4819")
                    .verificationAnswer("The main brass key is stamped with 402 (North Hall Room 402) and the AirPods pair under the name \"Maya-AirPods-Pro\".")
                    .proofDescription("AppleCare+ registration certificate matching serial H0YLP98204 and housing assignment letter for Room 402.")
                    .serialOrIdNumber("H0YLP98204")
                    .status("PENDING_VERIFICATION")
                    .collectionHubName("Security Desk 2")
                    .lockerBin("Bin S2-07")
                    .createdAt(Instant.parse("2026-10-09T19:10:00Z"))
                    .build();

            OwnershipClaim claim2 = OwnershipClaim.builder()
                    .id("clm-302")
                    .claimCode("CLM-2026-302")
                    .itemId("itm-103")
                    .itemReferenceCode("LF-2026-103")
                    .itemTitle("TI-84 Plus CE Python Graphing Calculator & ME-301 Lab Book")
                    .itemType("FOUND")
                    .claimantUserId("usr-owner-01")
                    .claimantName("Maya Lin")
                    .claimantEmail("maya.lin@campus.edu")
                    .claimantCampusId("STU-2026-4819")
                    .verificationAnswer("Inside the slide cover is a silver label with \"Maya Lin — STU-2026-4819\" and the lab notebook has my partner signature from Section 02.")
                    .proofDescription("Verified student ID card and matching handwriting in ME-301 Lab 1–3 records.")
                    .serialOrIdNumber("TI84-PY-99281")
                    .status("APPROVED")
                    .reviewedByOfficer("Sgt. Marcus Thorne")
                    .officerRemarks("Student ID and calculator slide-cover barcode matched 100%. Approved for fixed hub collection at Administration Block, Bin ADM-19.")
                    .pickupPassCode("PKP-8842-ADM19")
                    .collectionHubName("Administration Block")
                    .lockerBin("Bin ADM-19")
                    .createdAt(Instant.parse("2026-10-08T20:05:00Z"))
                    .verifiedAt(Instant.parse("2026-10-09T09:30:00Z"))
                    .build();

            claimRepository.saveAll(List.of(claim1, claim2));

            Notification notif1 = Notification.builder()
                    .id("ntf-501")
                    .recipientUserId("usr-owner-01")
                    .recipientRole("OWNER")
                    .title("Ownership Verified — Fixed Hub Pickup Pass Issued")
                    .message("Your ownership claim CLM-2026-302 for \"TI-84 Plus CE Python Graphing Calculator\" has been approved by Sgt. Marcus Thorne. Present Pickup Pass PKP-8842-ADM19 and your Campus ID at Administration Block (Bin ADM-19).")
                    .category("PICKUP_READY")
                    .relatedItemId("itm-103")
                    .actionCode("PKP-8842-ADM19")
                    .isRead(false)
                    .createdAt(Instant.parse("2026-10-09T09:30:00Z"))
                    .build();

            Notification notif2 = Notification.builder()
                    .id("ntf-502")
                    .recipientUserId("usr-admin-03")
                    .recipientRole("ADMIN_SECURITY")
                    .title("Pending Ownership Claim Requires Verification")
                    .message("Claim CLM-2026-301 submitted by Maya Lin (STU-2026-4819) for item LF-2026-102 (AirPods Pro on Navy Lanyard) held in Bin S2-07 at Security Desk 2.")
                    .category("VERIFICATION_UPDATE")
                    .relatedItemId("itm-102")
                    .actionCode("CLM-2026-301")
                    .isRead(false)
                    .createdAt(Instant.parse("2026-10-09T19:10:00Z"))
                    .build();

            Notification notif3 = Notification.builder()
                    .id("ntf-503")
                    .recipientUserId("usr-finder-02")
                    .recipientRole("FINDER")
                    .title("Fixed Hub Submission Receipt Confirmed")
                    .message("Thank you for submitting found item LF-2026-102 to Security Desk 2. Custody Receipt SUB-2026-7841 logged into Locker Bin S2-07.")
                    .category("CUSTODY_INTAKE")
                    .relatedItemId("itm-102")
                    .actionCode("SUB-2026-7841")
                    .isRead(false)
                    .createdAt(Instant.parse("2026-10-09T15:00:00Z"))
                    .build();

            notificationRepository.saveAll(List.of(notif1, notif2, notif3));
        }
    }
}
