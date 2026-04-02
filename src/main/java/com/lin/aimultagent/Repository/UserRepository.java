package com.lin.aimultagent.repository;

import com.lin.aimultagent.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    // 极其强大的 JPA：只需写这行代码，就能自动根据用户名查数据库！
    User findByUsername(String username);
}