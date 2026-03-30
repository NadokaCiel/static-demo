pipeline {
    agent any

    tools {
        // 对应 Jenkins 中配置的 Node 版本名称（请按你的 Jenkins 里实际的 tool 名称改这里）
        nodejs 'node22.19.0'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        choice(
            name: 'TARGET_ENV',
            choices: ['auto', 'dev', 'staging', 'production'],
            description: '构建环境：auto 按分支推断；也可手动指定 dev/staging/production'
        )
    }

    environment {
        // 部署目标目录：根据你的服务器实际路径修改
        // nginx 容器 root 固定为：/usr/share/nginx/html
        // 因为最终 URL 需要包含环境，所以我们把不同环境部署到不同子目录：
        // - /usr/share/nginx/html/static-demo/dev/
        // - /usr/share/nginx/html/static-demo/staging/
        // - /usr/share/nginx/html/static-demo/prod/
        DEV_HTML_PATH = '/usr/share/nginx/html/static-demo/dev'
        STAGING_HTML_PATH = '/usr/share/nginx/html/static-demo/staging'
        PROD_HTML_PATH = '/usr/share/nginx/html/static-demo/prod'

        // nginx 是运行在 docker 内的（目前只有一个容器）
        // - 请把容器名改成实际的 nginx 容器名
        // - 要求 Jenkins 运行机器具备 docker exec 权限
        NGINX_CONTAINER = 'Ciel-Nginx'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare') {
            steps {
                sh '''
                    set -euxo pipefail
                    rm -rf .output .nuxt
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    set -euxo pipefail
                    npm ci
                '''
            }
        }

        stage('Build') {
            steps {
                script {
                    // Jenkins 在不同流水线场景下 GIT_BRANCH 的格式可能不同，因此做一个稳妥的推断
                    def branch = (env.GIT_BRANCH ?: env.BRANCH_NAME ?: '').toString()
                    def effectiveEnv = params.TARGET_ENV

                    if (effectiveEnv == 'auto') {
                        // 你的分支：main / stg / develop
                        // 映射：develop->dev，stg->staging，main->production
                        if (branch ==~ /.*develop.*/ ) {
                            effectiveEnv = 'dev'
                        } else if (branch ==~ /.*stg.*/ ) {
                            effectiveEnv = 'staging'
                        } else if (branch ==~ /.*main.*/ ) {
                            effectiveEnv = 'production'
                        } else {
                            // 兜底：非 main/stg/develop 分支默认 dev
                            effectiveEnv = 'dev'
                        }
                    }

                    env.EFFECTIVE_ENV = effectiveEnv
                    echo "Effective env: ${env.EFFECTIVE_ENV}"

                    if (env.EFFECTIVE_ENV == 'dev') {
                        sh 'npm run build:dev'
                    } else if (env.EFFECTIVE_ENV == 'staging') {
                        sh 'npm run build:staging'
                    } else {
                        sh 'npm run build:prod'
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    def deployPath = ''
                    def reloadCmd = "docker exec ${env.NGINX_CONTAINER} nginx -s reload"

                    if (env.EFFECTIVE_ENV == 'dev') {
                        deployPath = env.DEV_HTML_PATH
                    } else if (env.EFFECTIVE_ENV == 'staging') {
                        deployPath = env.STAGING_HTML_PATH
                    } else {
                        deployPath = env.PROD_HTML_PATH
                    }

                    sh """
                        set -euxo pipefail
                        mkdir -p '${deployPath}'
                        rm -rf '${deployPath:?}'/*
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

