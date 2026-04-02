package com.lin.aimultagent.service.impl;

import com.lin.aimultagent.common.result.Result;
import com.lin.aimultagent.dto.request.AuthRequest;
import com.lin.aimultagent.entity.PlayerSave;
import com.lin.aimultagent.entity.User;
import com.lin.aimultagent.repository.PlayerSaveRepository;
import com.lin.aimultagent.repository.UserRepository;
import com.lin.aimultagent.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service // 🌟 必须加上这个注解，告诉 Spring 这是一个业务 Bean
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlayerSaveRepository saveRepository;

    @Override
    @Transactional(rollbackFor = Exception.class) // 🌟 加上事务！如果建号成功但建存档失败，会自动回滚，防止产生“孤儿账号”
    public Result register(AuthRequest req) {
        // 1. 检查是否重名
        if (userRepository.findByUsername(req.getUsername()) != null) {
            return Result.error("用户名已被注册啦，换一个吧！");
        }

        // 2. 创建用户
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(req.getPassword());
        user = userRepository.save(user);

        // 3. 初始化游戏存档
        PlayerSave save = new PlayerSave();
        save.setId(user.getId());
        save.setFocusCrystals(0);
        save.setBaseLevel(1);
        save.setLinxiaAffection(50);
        save.setSuwanAffection(50);
        saveRepository.save(save);

        return Result.success(user.getId());
    }

    @Override
    public Result login(AuthRequest req) {
        User user = userRepository.findByUsername(req.getUsername());
        if (user == null || !user.getPassword().equals(req.getPassword())) {
            return Result.error("账号或密码错误，是不是记错了？");
        }
        return Result.success(user.getId());
    }
}