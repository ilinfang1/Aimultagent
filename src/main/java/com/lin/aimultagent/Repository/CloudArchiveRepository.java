package com.lin.aimultagent.repository; // 注意这里的包名要匹配你的目录

import com.lin.aimultagent.entity.CloudArchive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CloudArchiveRepository extends JpaRepository<CloudArchive, Long> {
    // 继承 JpaRepository 就能自动拥有自带的 save, findById 等强大方法，一行 SQL 都不用写！
}