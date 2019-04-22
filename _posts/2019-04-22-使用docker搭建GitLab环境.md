---
layout:     post
title:         使用docker搭建GitLab环境
subtitle:   使用docker搭建GitLab环境
date:       2019-04-22
author:     冷小冰
header-img: img/post-bg-debug.png
catalog: true
tags:
    - Docker
    - GitLab
---
# 使用docker搭建GitLab环境

## 1.拉取gitlab镜像

### 1.1.搜索镜像

[Docker Hub](https://hub.docker.com/)

在官网可以找到各种各样需要的镜像，通过搜索可以找到gitlab镜像。

### 1.2.拉取gitlab镜像

```shell
docker pull gitlab/gitlab-ce
```

**注意**：如果没有指定对应的版本，默认会拉取 **latest**版本。

通过docker images 命令看到gitlab镜像证明你已经pull完了

```shell
[root@localhost ~]# docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
gitlab/gitlab-ce    latest              c752bc978a4b        4 days ago          1.78GB
```

## 2.启动gitlab

运行：

```shell
docker run --detach --hostname 192.168.3.34 --publish 444:443 --publish 81:80 --publish 23:22 --name gitlab --restart always --volume /opt/gitlab/config:/etc/gitlab --volume /opt/gitlab/logs:/var/log/gitlab --volume /opt/gitlab/data:/var/opt/gitlab c752bc978a4b
```

- **--hostname** ：指定容器中绑定的域名，会在创建镜像仓库的时候使用到，这里绑定192.168.3.34
- **--publish**：端口映射；容器内的443，80，22端口，分别映射到宿主机的444，81，23端口
- **--volume** ：挂载数据卷，映射到容器中去的容器外部存储空间
- **c752bc978a4b** ：镜像的ID

数据存储地方

| 本地的位置         | 容器的位置      | 作用                   |
| :----------------- | :-------------- | :--------------------- |
| /opt/gitlab/config | /etc/gitlab     | 用于存储GitLab配置文件 |
| /opt/gitlab/logs   | /var/log/gitlab | 用于存储日志           |
| /opt/gitlab/data   | /var/opt/gitlab | 用于存储应用数据       |

通过docker ps 命令看到gitlab容器证明已经运行成功了

```shell
[root@localhost ~]# docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS                    PORTS                                                          NAMES
9e12ae220c14        c752bc978a4b        "/assets/wrapper"   13 minutes ago      Up 13 minutes (healthy)   0.0.0.0:23->22/tcp, 0.0.0.0:81->80/tcp, 0.0.0.0:444->443/tcp   gitlab
```

## **3.配置GitLab**

所有的配置都在唯一的配置文件 **/opt/gitlab/config/gitlab.rb**。

本文是直接修改生成的配置文件，当然也可以进入容器内部通过**shell**会话进行相关操作。

```shell
# 进入容器命令
docker exec -it gitlab /bin/bash
```

### 3.1.配置端口

**编辑gitlab.rb文件**

修改如下几个端口，修改与docker映射的端口一致

```xml
# external_url 'GENERATED_EXTERNAL_URL'
external_url "http://192.168.3.34:81"

# gitlab_rails['gitlab_shell_ssh_port'] = 22
gitlab_rails['gitlab_shell_ssh_port'] = 23

# nginx['listen_port'] = nil
nginx['listen_port'] = 81

#如果用了Https，下面的端口也修改
# nginx['redirect_http_to_https_port'] = 80
```

**说明**：

- **external_url**：GitLab的资源都是基于这个URL，其实就是clone的地址，如果不配置端口81，使用http进行clone时，页面链接会不显示端口，复制出来的链接会无效；
- **gitlab_shell_ssh_port**：ssh端口，使用ssh进行clone时的端口；
- **listen_port**：nginx监听的端口；
- **redirect_http_to_https_port**：使用https时，nginx监听的端口；

**注意**：这里修改完毕，会有一个**坑**，具体看目录  **3.4.重新创建**

### 3.2. 邮箱配置

GitLab的使用过程中涉及到大量的邮件，而邮件服务可以选择使用`Postfix`，`sendmai`配置`SMTP`服务其中一种；

`Postfix`还要安装其他东西，`sendmai`又是比较老，相对较下`SMTP`配置起来会比较方便。

**编辑gitlab.rb文件** 

添加如下配置

```xml
gitlab_rails['smtp_enable'] = true
gitlab_rails['smtp_address'] = "smtp.163.com"
gitlab_rails['smtp_port'] = 25
gitlab_rails['smtp_user_name'] = "XXX@163.com"
gitlab_rails['smtp_password'] = "password"
gitlab_rails['smtp_domain'] = "163.com"
gitlab_rails['smtp_authentication'] = :login
gitlab_rails['smtp_enable_starttls_auto'] = true
gitlab_rails['gitlab_email_from'] = "XXX@163.com"
user["git_user_email"] = "XXX@163.com"
```

**说明：**

- **gitlab_rails['smtp_address']** ：SMTP服务地址，不同的服务商不同
- **gitlab_rails['smtp_port']** ：服务端口
- **gitlab_rails['smtp_user_name']** ：用户名，自己注册的
- **gitlab_rails['smtp_password']** ：客户端授权秘钥
- **gitlab_rails['gitlab_email_from']** ：发出邮件的用户，注意跟用户名保持一致
- **user["git_user_email"]** ：发出用户，注意跟用户名保持一致

### 3.3.刷新配置

```shell
# 进入容器
docker exec -it gitlab /bin/bash
# 刷新配置
gitlab-ctl reconfigure
```

### 3.4.重新创建

经过上述的配置，会发现打不开gitlab的网页，这是因为修改了external_url，会导致container内部的项目80端口也被直接转到了81端口，所以需要重新映射端口。

**关闭容器**

```shell
docker stop gitlab
```

**删除容器**

```shell
docker rm gitlab
```

**重新创建容器**

将原来的**--publish 81:80**改为**--publish 81:81**

```shell
docker run --detach --hostname 192.168.3.34 --publish 444:443 --publish 81:81 --publish 23:22 --name gitlab --restart always --volume /opt/gitlab/config:/etc/gitlab --volume /opt/gitlab/logs:/var/log/gitlab --volume /opt/gitlab/data:/var/opt/gitlab c752bc978a4b
```

