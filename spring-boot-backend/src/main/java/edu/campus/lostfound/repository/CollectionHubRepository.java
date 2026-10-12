package edu.campus.lostfound.repository;

import edu.campus.lostfound.entity.CollectionHub;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollectionHubRepository extends JpaRepository<CollectionHub, String> {
}
