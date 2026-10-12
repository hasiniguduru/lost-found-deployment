package edu.campus.lostfound.repository;

import edu.campus.lostfound.entity.ItemReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemReportRepository extends JpaRepository<ItemReport, String> {
    List<ItemReport> findAllByOrderByCreatedAtDesc();
}
