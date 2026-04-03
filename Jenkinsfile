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

    // ===== 以下仅由「本仓库」维护：项目名 + 各环境子路径；与 .env 中 NUXT_PUBLIC_BASE_URL 一致 =====
    // Jenkins 全局不应写死业务目录；其它项目请复制本文件并只改本节 + NGINX_CONTAINER / HTML_ROOT（若挂载不同）
    environment {
        // Nginx 容器内静态根（与挂载到容器的 html 目录一致）
        HTML_ROOT = '/usr/share/nginx/html'
        // 本项目在 URL / 磁盘上的路径段（如 baseURL 为 /static-demo/dev/ 时此处为 static-demo）
        PROJECT_SLUG = 'static-demo'
        // 各环境下挂在 PROJECT_SLUG 后的目录名（可按项目自定义，如 stg、preview 等）
        SEGMENT_DEV = 'dev'
        SEGMENT_STAGING = 'staging'
        SEGMENT_PROD = 'prod'

        NGINX_CONTAINER = 'nginx'
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
                    def branch = (env.GIT_BRANCH ?: env.BRANCH_NAME ?: '').toString()
                    def effectiveEnv = params.TARGET_ENV

                    if (effectiveEnv == 'auto') {
                        if (branch ==~ /.*develop.*/ ) {
                            effectiveEnv = 'dev'
                        } else if (branch ==~ /.*stg.*/ ) {
                            effectiveEnv = 'staging'
                        } else if (branch ==~ /.*main.*/ ) {
                            effectiveEnv = 'production'
                        } else {
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
