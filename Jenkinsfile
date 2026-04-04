// 母版：仅支持 Pipeline script from SCM
// 变量集中在仓库根目录 jenkins.properties（见 jenkins.properties.example）

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        choice(
            name: 'TARGET_ENV',
            choices: ['auto', 'dev', 'staging', 'production'],
            description: '构建环境：auto 按分支推断'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('LoadJenkinsProperties') {
            steps {
                script {
                    def text = readFile(encoding: 'UTF-8', file: 'jenkins.properties')
                    def props = [:]
                    text.split('\n').each { raw ->
                        def line = raw.trim()
                        if (!line || line.startsWith('#')) {
                            return
                        }
                        def idx = line.indexOf('=')
                        if (idx > 0) {
                            def k = line.substring(0, idx).trim()
                            def v = line.substring(idx + 1).trim()
                            props[k] = v
                        }
                    }
                    env.HTML_ROOT = props.HTML_ROOT
                    env.PROJECT_SLUG = props.PROJECT_SLUG
                    // SEGMENT 允许不填：默认按 dev / staging / prod 映射
                    env.SEGMENT_DEV = (props.get('SEGMENT_DEV') ?: 'dev').toString()
                    env.SEGMENT_STAGING = (props.get('SEGMENT_STAGING') ?: 'staging').toString()
                    env.SEGMENT_PROD = (props.get('SEGMENT_PROD') ?: 'prod').toString()
                    env.NGINX_CONTAINER = props.NGINX_CONTAINER
                    env.NODE_VERSION = props.NODE_VERSION
                    env.DOCKER_IMAGE_PREFIX = props.DOCKER_IMAGE_PREFIX
                    env.ALLOWED_BRANCHES = (props.get('ALLOWED_BRANCHES') ?: 'develop,stg,main').toString()
                    env.DOCKER_BUILD_TAG = "${props.DOCKER_IMAGE_PREFIX}-${env.BUILD_NUMBER}"
                    env.SKIP_PIPELINE = 'false'
                    echo "jenkins.properties: NODE_VERSION=${env.NODE_VERSION}, PROJECT_SLUG=${env.PROJECT_SLUG}"
                }
            }
        }

        stage('BranchGuard') {
            steps {
                script {
                    // webhook/触发器只负责“进来”，最终是否构建由这里兜底限制：
                    // 仅当 push 到 develop/stg/main（或 PR 合并后的目标分支）时才真正执行流水线。
                    def rawBranch = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').toString()
                    def branch = rawBranch
                    branch = branch.replaceAll('^origin/', '')
                    branch = branch.replaceAll('^refs/heads/', '')
                    def allowed = env.ALLOWED_BRANCHES
                            .split(',')
                            .collect { it.trim() }
                            .findAll { it }

                    if (!branch) {
                        echo "BranchGuard: 无法识别分支（raw=${rawBranch}），将跳过构建。"
                        env.SKIP_PIPELINE = 'true'
                        currentBuild.result = 'NOT_BUILT'
                        return
                    }

                    if (!allowed.contains(branch)) {
                        echo "BranchGuard: 分支 ${branch} 不在允许列表 ${allowed} 内，将跳过构建。"
                        env.SKIP_PIPELINE = 'true'
                        currentBuild.result = 'NOT_BUILT'
                        return
                    }

                    echo "BranchGuard: 分支 ${branch} 允许，继续执行。"
                }
            }
        }

        stage('Prepare') {
            when {
                expression { env.SKIP_PIPELINE != 'true' }
            }
            steps {
                sh '''
                    set -euxo pipefail
                    rm -rf .output .nuxt
                '''
            }
        }

        stage('Build') {
            when {
                expression { env.SKIP_PIPELINE != 'true' }
            }
            steps {
                script {
                    def branch = (env.GIT_BRANCH ?: env.BRANCH_NAME ?: '').toString()
                    def effectiveEnv = params.TARGET_ENV

                    if (effectiveEnv == 'auto') {
                        if (branch ==~ /.*develop.*/) {
                            effectiveEnv = 'dev'
                        } else if (branch ==~ /.*stg.*/) {
                            effectiveEnv = 'staging'
                        } else if (branch ==~ /.*main.*/) {
                            effectiveEnv = 'production'
                        } else {
                            effectiveEnv = 'dev'
                        }
                    }

                    env.EFFECTIVE_ENV = effectiveEnv
                    echo "Effective env: ${env.EFFECTIVE_ENV}"

                    def npmScript = 'build:prod'
                    if (env.EFFECTIVE_ENV == 'dev') {
                        npmScript = 'build:dev'
                    } else if (env.EFFECTIVE_ENV == 'staging') {
                        npmScript = 'build:staging'
                    }

                    sh """
                        set -euxo pipefail
                        docker build -f Dockerfile -t ${env.DOCKER_BUILD_TAG} \\
                          --build-arg NODE_VERSION=${env.NODE_VERSION} \\
                          --build-arg NPM_SCRIPT=${npmScript} \\
                          .
                        cid=\$(docker create ${env.DOCKER_BUILD_TAG})
                        mkdir -p .output
                        docker cp \$cid:/app/.output/public/. .output/public/
                        docker rm \$cid
                        # 清理临时构建镜像：避免长期占用磁盘
                        docker rmi -f ${env.DOCKER_BUILD_TAG} >/dev/null 2>&1 || true
                    """
                }
            }
        }

        stage('Deploy') {
            when {
                expression { env.SKIP_PIPELINE != 'true' }
            }
            steps {
                script {
                    def seg = ''
                    if (env.EFFECTIVE_ENV == 'dev') {
                        seg = env.SEGMENT_DEV
                    } else if (env.EFFECTIVE_ENV == 'staging') {
                        seg = env.SEGMENT_STAGING
                    } else {
                        seg = env.SEGMENT_PROD
                    }
                    def deployPath = "${env.HTML_ROOT}/${env.PROJECT_SLUG}/${seg}"
                    def reloadCmd = "docker exec ${env.NGINX_CONTAINER} nginx -s reload"

                    sh """
                        set -euxo pipefail
                        mkdir -p '${deployPath}'
                        rm -rf '${deployPath}'/*
                        cp -rf .output/public/* '${deployPath}/'
                        ${reloadCmd}
                    """

                    echo "Deploy ${env.EFFECTIVE_ENV} to ${deployPath}"
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline success'
        }
        failure {
            echo 'Pipeline failed'
        }
    }
}
