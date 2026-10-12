package edu.campus.lostfound.repository;

import edu.campus.lostfound.entity.OwnershipClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OwnershipClaimRepository extends JpaRepository<OwnershipClaim, String> {
    List<OwnershipClaim> findAllByOrderByCreatedAtDesc();
}
