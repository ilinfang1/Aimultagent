package com.lin.aimultagent.repository;

import com.lin.aimultagent.entity.PlayerSave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 存档数据库操作接口
 */
@Repository
public interface PlayerSaveRepository extends JpaRepository<PlayerSave, Integer> {
    // 继承 JpaRepository 后，自动拥有 save(), findById() 等基本方法
}