# 0. 프로젝트 소개

> **삼육대학교 KDT 3차 프로젝트** <br/> **개발기간: 2025.08 ~ 2025.09**

**프로젝트명** : **메디컨(MEDICON)**

의료 현장에서는 환자의 생명과 직결되는 순간마다, 의료진이 신속하게 의료 영상을 확인해야 할 일이 반복됩니다. 하지만 현실은 녹록지 않습니다.

병원 복도, 응급실, 외래 진료실등…

어디서든 의료진은 수많은 영상 데이터 속에서 필요한 정보를 빠르게 찾고, 정확하게 진단해야 합니다.

`메디컨(MEDICON)`은 바로 이 지점에서 출발했습니다. 저희는 단순히 의료 데이터를 전달하는 시스템을 넘어, 의료진에게는 신속하고 정확한 진단 환경을, 환자에게는 더 안전하고 신뢰할 수 있는 치료 경험을 제공하는 건강한 의료 데이터 생태계를 구축하고자 합니다.

📃 *더 나은 진료, 더 나은 연결* <br><br>
<img width="400" height="400" alt="Image" src="https://github.com/user-attachments/assets/2ea7c3c5-3569-4dda-88bf-443524b168ed" />

- 진료 현장의 빠른 의사결정을 위한 최소한의 단계를 통해 재빠른 선택을 할 수 있도록 돕습니다.
- 빠른 의료정보 확인을 통한 의사결정을 위한 최적화 된 기능을 제공합니다.
- 쉽게 적응할 수 있는 사용자 친화적 디자인을 통해 신규 의료진이나 외부 협진에서도 협업을 위한 도구로 사용할 수 있습니다.


<br>

# 1. 주요 기능

### 🖥️ 웹 기반 DICOM 뷰어

언제 어디서든, 별도의 프로그램 설치 없이 웹 브라우저만으로 의료 영상(CT, MRI, X-ray 등)을 신속하게 조회하고 분석할 수 있습니다.

-   **빠른 영상 로딩 및 뷰어 기능**  
    대용량 DICOM 이미지 파일을 처리하여 의료진이 진단에 필요한 영상을 지체 없이 확인할 수 있도록 지원합니다.

-   **직관적인 인터페이스**  
    확대, 축소, 이동, 밝기 및 대비 조절 등 필수적인 뷰어 기능을 사용하기 쉬운 UI로 제공하여 진료 효율성을 극대화합니다.

### ✍️ 이미지 어노테이션 (Image Annotation)

의료 영상 위에 직접 소견을 표시하고 측정하며, 협업을 위한 근거를 마련합니다.

-   **다양한 어노테이션 도구**  
    특정 부위를 강조하는 원, 사각형 등의 도형 도구와 함께 거리, 각도 등을 측정할 수 있는 기능을 제공합니다.

### 📄 환자 소견서 작성 및 관리

영상 분석부터 소견서 작성까지의 워크플로우를 통합하여, 진단 과정을 간소화하고 문서 작업의 효율을 높입니다.

-   **통합 문서 작성 환경**  
    뷰어에서 분석한 내용을 바탕으로 시스템 내에서 즉시 소견서를 작성하고 관리할 수 있습니다.
 
-   **데이터 연동 및 이력 관리**  
    환자 정보와 진단 영상, 그리고 작성된 소견서를 유기적으로 연결하여 환자별 진료 이력을 체계적으로 추적하고 관리할 수 있습니다.

# 2. 페이지별 기능

> 각 사용자 역할에 따라 제공되는 핵심 기능 목록입니다.

### 👨‍⚕️ 의료진 (일반 사용자) 페이지

의료진은 환자 정보를 검색하고, 의료 영상을 분석하여 진단 소견서를 작성하는 등 진료의 핵심적인 업무를 수행합니다.

| 기능            | 설명                                                               |
|:--------------|:-----------------------------------------------------------------|
| **환자 검색**     | 환자 이름, ID 등으로 신속하게 검색하여 해당 환자의 의료 영상 및 과거 진료 기록에 접근합니다.          |
| **환자 소견서 작성** | 영상 분석 결과를 바탕으로 환자의 상태에 대한 공식적인 소견서를 시스템 내에서 작성하고 저장 및 관리합니다.     |
| **이미지 어노테이션** | DICOM 뷰어에서 영상에 직접 주석, 측정값, 메모 등을 추가하여 진단의 정확성을 높이고 주요 소견을 기록합니다. |


<br>

<details>
<summary><strong>의료진 페이지 주요 기능 상세보기 (클릭)</strong></summary>

#### 1. 환자 검색
- 환자 이름, ID 등으로 신속하게 검색하여 해당 환자의 의료 영상 및 과거 진료 기록에 접근합니다.
- 검색 결과는 환자의 기본 정보와 함께 소견 내용까지 한눈에 볼 수 있도록 표시됩니다.
- 검색된 환자를 클릭하면 뷰어 페이지로 이동하여 의료 영상을 확인하고 주석을 작성할 수 있습니다.

|                                         환자 검색 시연                                          |
|:-----------------------------------------------------------------------------------------:|
| ![Image](https://github.com/user-attachments/assets/e7647d3c-9915-43da-bce1-bbc51aa07b20) |

<br>

#### 2. 환자 소견서 작성
- 검색 시스템 내에서 즉시 소견서를 작성하고 관리할 수 있습니다.
- 이전에 작성된 소견서를 불러와 수정하거나, 새로 작성할 수 있습니다.
- 작성된 소견서는 환자 정보와 연동됩니다.

|                                       환자 소견서 작성 시연                                        |
|:-----------------------------------------------------------------------------------------:|
| ![Image](https://github.com/user-attachments/assets/c463c55c-3ef2-442e-bf13-9db610f64b4a) |

<br>

#### 3. 이미지 어노테이션
- DICOM 뷰어에서 영상에 직접 주석, 측정값, 메모 등을 추가하여 소견을 기록할 수 있습니다.
- 다양한 도형 도구(원, 사각형 등)와 측정 도구(거리, 각도 등)를 사용하여 중요한 부위를 강조하고 분석할 수 있습니다.
- 각 주석마다 메모를 추가하여 상세한 설명을 덧붙일 수 있습니다.

|                                      이미지 어노테이션 작성 시                                      |
|:-----------------------------------------------------------------------------------------:|
| ![Image](https://github.com/user-attachments/assets/a92eca9d-28ab-4691-84c3-968442b76172) |

</details>

<br>

### ⚙️ 관리자 (ADMIN) 페이지

관리자는 시스템의 전반적인 운영을 감독하고, 사용자 활동 로그를 모니터링하며 계정 권한을 관리하여 보안과 안정성을 유지합니다.

| 기능           | 설명                                                             |
|:-------------|:---------------------------------------------------------------|
| **사용자 관리**   | 시스템을 사용하는 의료진 및 기타 직원의 계정을 생성, 수정, 삭제하고 각 역할에 맞는 접근 권한을 부여합니다. |
| **주석 로그 확인** | 의료 영상에 추가되거나 수정된 모든 어노테이션(주석)의 이력을 추적하여 진단 과정의 투명성을 확보합니다.     |
| **조회 로그 확인** | 어떤 사용자가 언제, 어떤 환자의 의료 정보에 접근했는지 기록된 로그를 확인하여 정보 보안을 강화합니다.     |


<br>

<details>
<summary><strong>관리자 페이지 주요 기능 상세보기 (클릭)</strong></summary>

#### 1. 사용자 관리
- 페이지 접속 시 현재 시스템 내 모든 사용자 목록을 확인할 수 있습니다.
- 사용자를 추가하는 '추가' 버튼을 클릭하여 새로운 사용자를 등록할 수 있습니다.
- 사용자에게 맞는 정보를 검색을 통해 원하는 사용자를 빠르게 찾을 수 있습니다.

|                                         계정 추가 시연                                          |
|:-----------------------------------------------------------------------------------------:|
| ![Image](https://github.com/user-attachments/assets/dcb98284-e9e6-4671-a6f3-feeb633bcc48) |

|                                       계정 리스트 확인 시연                                        |
|:-----------------------------------------------------------------------------------------:|
| ![Image](https://github.com/user-attachments/assets/b9ccd890-87a6-4878-b730-58b81d1071ae) |

<br>

#### 2. 주석 로그 확인
- 각 사용자가 언제, 어떤 환자의 의료 영상에 어떠한 작업을 했는지 상세히 기록된 로그를 확인할 수 있습니다.
- 로그는 날짜, 사용자, 환자 ID 등 다양한 필터링 옵션을 제공하여 원하는 정보를 쉽게 찾을 수 있습니다.
- 보안 사고 예방 및 감사 목적으로 활용할 수 있습니다.


|                                        주석 로그 확인 시연                                        |
|:-----------------------------------------------------------------------------------------:|
| ![Image](https://github.com/user-attachments/assets/82f6d076-7b70-44d5-adc5-a27805a644c5) |

<br>

#### 3. 조회 로그 확인
- 각 시용자가 어떠헌 환자의 의료 영상에 접근했는지 상세히 기록된 로그를 확인할 수 있습니다.
- 로그는 필터링 옵션을 제공하여 원하는 정보를 쉽게 찾을 수 있습니다.
- 보안 사고 예방 및 감사 목적으로 활용할 수 있습니다.

|                                        조회 로그 확인 시연                                        |
|:-----------------------------------------------------------------------------------------:|
| ![Image](https://github.com/user-attachments/assets/7e35fba0-508b-48ce-96d9-ebf8ee6e3402) |

</details>

<br>

<br>

# 3. 팀원 구성 및 역할

| ![김재현](https://github.com/kod0406.png) | ![류재열](https://github.com/fbwoduf112.png?size=100) | ![이남현](https://github.com/hyun3138.png?size=100) | ![장준익](https://github.com/No4hh4oN.png) | ![정서우](https://github.com/8woes.png?size=100) |
|:--------------------------------------:|:--------------------------------------------------:|:------------------------------------------------:|:---------------------------------------:|:---------------------------------------------:|
| [**김재현**](https://github.com/kod0406)  |      [**류재열**](https://github.com/fbwoduf112)      |      [**이남현**](https://github.com/hyun3138)      | [**장준익**](https://github.com/No4hh4oN)  |      [**정서우**](https://github.com/8woes)      |

> **💡 팀워크 철학**  
> 모든 기능의 설계, 구현, 테스트 과정에서 팀원들과 긴밀히 협업하며 진행하였습니다.

### 👨‍💼 김재현 (팀장) - 
- **문서 관리**: 프로젝트 기획서, 요구사항 명세서, 최종 발표 자료 등 모든 문서 작성 및 관리를 담당했습니다.
- **JWT 토큰 관리**: `Spring Security`와 `JWT`를 활용한 인증 및 권한 관리 시스템을 설계하고 구현했습니다.
- **Jasypt 암호화**: `Jasypt` 라이브러리를 사용하여 민감한 데이터(예: 비밀번호, 시크릿 키 등)를 안전하게 암호화하고 복호화하는 기능을 개발했습니다.


### 👤 류재열 
- **외부(DICOM DB)시스템 연계 기능 관리**: `Mybatis`를 활용하여 외부 DICOM 데이터베이스와의 연동 기능을 설계하고 구현했습니다.
- **어노테이션 관리**: DICOM 뷰어에서 이미지 어노테이션(주석) 기능을 개발하고, 관련 데이터를 데이터베이스에 저장 및 조회하는 기능을 구현했습니다.
- **관리자 페이지 개발**: 관리자 페이지의 핵심 기능(사용자 관리, 로그 확인 등)을 설계하고 구현했습니다.
- **프론트엔드 협업**: 프론트엔드 팀원과 긴밀히 협력하여 API 연동 및 데이터 흐름을 최적화했습니다.

### 🎨 이남현 
- **모델링 및 내부 DB 설계(사용자)**: `ERD`를 기반으로 내부 사용자 데이터베이스 구조를 설계하고, `Mybatis` 매퍼를 작성하여 데이터베이스와의 상호작용을 구현했습니다.
- **관리자 페이지 개발**: 관리자 페이지의 핵심 기능(사용자 관리, 로그 확인 등)을 설계하고 구현했습니다.
- **로그 생성 및 관리**: 사용자 활동 로그(조회 로그, 주석 로그 등)를 기록하고 관리하는 기능을 개발했습니다.
- **API 설계 및 문서화**: `Swagger`를 사용하여 RESTful API를 설계하고, 명세서를 작성하여 팀원들과 공유했습니다.

### 👝 장준익
- **프론트엔드 개발**: `React`와 `TypeScript`, `Vite` 를 사용하여 사용자 인터페이스를 설계하고 구현했습니다.
- **UX,UI 고문**: 사용자 경험(UX)과 사용자 인터페이스(UI) 디자인에 대한 자문을 제공하여, 사용자가 직관적으로 시스템을 이용할 수 있도록 지원했습니다.
- **사용자 테스트 및 디버깅**: 프론트엔드 애플리케이션의 기능 테스트 및 디버깅을 담당하여, UI/UX 보강 및 사용자 피드백을 반영했습니다.

### 🎒 정서우
- **와이어프레임 및 UI/UX 디자인**: 웹 애플리케이션의 와이어프레임과 UI/UX 디자인을 설계했습니다.
- **프론트엔드 개발**: `React`와 `TypeScript`, `Vite` 를 사용하여 사용자 인터페이스를 설계하고 구현했습니다.
- **DICOM 뷰어 통합**: `Cornerstone.js` 라이브러리를 활용하여 웹 기반 DICOM 뷰어를 개발하고, 이미지 어노테이션 기능을 구현했습니다.
- **협업 및 커뮤니케이션**: 백엔드 팀원과 긴밀히 협력하여 API 연동 및 데이터 흐름을 최적화했습니다.

<br>

# 4. 기술 스택 및 아키텍처

## 🛠️ 기술 스택
| 구분               | 주요 기술 스택                                                  |
|:-----------------|:----------------------------------------------------------|
| **⚙️ Back-end**  | `Java` `Spring Boot` `Mybatis` `ORACLE DB` `JWT`          |
| **🎨 Front-end** | `React` `TypeScript` `Axios` `Tailwind CSS`  `Npm` `Vite` | |
| **🤝 협업 도구**     | `GitHub` `Notion` `Swagger` `Postman`                     |
| **🔗 외부 라이브러리**  | `Jasypt` `Cornerstone.js`                                 |

## 📁 프로젝트 구조

아래는 메디컨(MEDICON) 백엔드 프로젝트의 실제 폴더 및 파일 구조입니다.

```
📦 backend
├── 📄 build.gradle           # Gradle 빌드 설정 파일
├── 📄 settings.gradle        # Gradle 프로젝트 설정
├── 📄 gradlew, gradlew.bat   # Gradle Wrapper 실행 파일
├── 📄 Readme.md              # 프로젝트 설명 문서
├── 📂 src
│   ├── 📂 main
│   │   ├── 📂 java
│   │   │   └── com
│   │   │       └── example
│   │   │           └── med
│   │   │               ├── 📄 MedApplication.java      # 메인 실행 클래스
│   │   │               ├── 📂 config                   # 환경 및 보안 설정
│   │   │               ├── 📂 controller               # REST API 컨트롤러
│   │   │               ├── 📂 dto                      # 데이터 전송 객체
│   │   │               ├── 📂 jwt                      # JWT 인증 관련
│   │   │               ├── 📂 mapper                   # MyBatis 매퍼 인터페이스
│   │   │               ├── 📂 service                  # 서비스 로직
│   │   │               └── 📂 util                     # 유틸리티 클래스
│   │   └── 📂 resources
│   │       ├── 📄 application.properties               # 환경 변수 설정
│   │       └── 📂 mapper
│   │           ├── 📄 Dicom.xml                        # DICOM 관련 쿼리
│   │           └── 📂 second
│   │               ├── 📄 AnnotationMapper.xml         # 어노테이션 쿼리
│   │               ├── 📄 StudyCommentMapper.xml       # 소견 쿼리
│   │               └── 📄 UserInfoMapper.xml           # 사용자 정보 쿼리
│   └── 📂 test
│       └── 📂 java
│           └── com
│               └── example
│                   └── med
│                       └── 📄 MedApplicationTests.java # 테스트 코드
└── 📂 build
    └── ... (빌드 결과물)
```

<br>

# 5. 메디컨 프로젝트 실행 가이드

>메디컨 프로젝트를 로컬 환경에서 설정하고 실행하기 위한 가이드입니다.


## 📝 목차

1.  [시스템 요구사항](#시스템-요구사항)
2.  [실행 방법](#실행-방법)
    -   [Back-end](#1-back-end-실행)
    -   [Front-end](#2-front-end-실행)
3.  [API 문서 확인](#api-문서-swagger-ui)
4.  [환경 변수 설정](#환경-변수-설정-applicationproperties)

<br>

##  시스템 요구사항

프로젝트 실행을 위해 아래 환경을 구성해야 합니다.

### 🔧 필수 실행 환경

| 구성 요소      | 버전        | 비고              |
|:-----------|:----------|:----------------|
| **JDK**    | `17` 이상   | Java 개발 키트      |
| **Gradle** | `7.x` 이상  | 빌드 도구           |
| **npm**    | `10.x` 이상 | Node.js 패키지 매니저 |
| **RDBS**   |           | 관계형 데이터베이스      |
| **Vite**   | `4.x` 이상  | 프론트엔드 빌드 도구     |

<br>

### 📚 주요 의존성 라이브러리

프로젝트는 다음과 같은 핵심 라이브러리들을 기반으로 구성되어 있습니다.

**🌟 Spring Boot Ecosystem**
- Spring Boot Starter (Web, Mybatis, Security, Test)
- Spring Boot DevTools (개발 편의성)
- Spring Security Test

**🗄️ Database & Storage**
- ORACLE JDBC Driver
- HikariCP (커넥션 풀)

**🔐 인증 & 보안**
- JJWT (JWT 토큰 처리)
- Spring Security

**🎨 UI & View**
- React
- Tailwind CSS
- Swagger (springdoc-openapi) - API 문서화

**🔧 Utility Libraries**
- Lombok (코드 간소화)
- Jasypt (암호화)
- Apache Commons Lang (유틸리티 함수)
- Cornerstone.js (DICOM 뷰어)
- WebFlux (비동기 처리)

**🧪 테스트 & 개발**
- JUnit (단위 테스트)
- Spring Security Test (보안 테스트)

> 📋 **상세 의존성 정보**  
> 전체 라이브러리 목록과 버전 정보는 프로젝트 루트의 `build.gradle` 파일을 참고하세요.

##  실행 방법

### 1. Back-end 실행

#### Git에서 프로젝트 가져오기

```bash
# 1. 프로젝트를 클론합니다.
git clone https://github.com/pj-2025-med/backend.git

# 2. 프로젝트 디렉토리로 이동합니다.
cd backend
```

#### 환경 설정

1.  `src/main/resources/` 경로에 `application.properties` 파일을 생성합니다.
2.  아래의 [환경 변수 설정](#환경-변수-설정-applicationproperties) 섹션을 참고하여 본인의 로컬 환경에 맞게 파일 내용을 채워넣습니다.

#### 애플리케이션 실행 (2가지 방법)

**방법 1: Gradle 명령어 사용**

```bash
# 1. 프로젝트 빌드 (Windows)
./gradlew.bat clean build

# 1. 프로젝트 빌드 (Mac/Linux)
./gradlew clean build

# 2. 애플리케이션 실행
./gradlew bootRun
```

**방법 2: JAR 파일 직접 실행**

```bash
# 빌드된 JAR 파일을 직접 실행합니다.
java -jar build/libs/MED-project-0.0.1-SNAPSHOT.jar
```

> ℹ️ **서버 접속**
>
> 백엔드 서버는 기본적으로 `http://localhost:8080` 에서 실행됩니다.

### 2. Front-end 실행

#### Git에서 프로젝트 가져오기

```bash
# 1. 프로젝트를 클론합니다.
git clone https://github.com/pj-2025-med/frontend.git

# 2. 프로젝트 디렉토리로 이동합니다.
cd frontend
```

#### 개발 서버 실행

```bash
# 1. 프론트엔드 디렉터리로 이동합니다.
cd frontend

# 2. 필요한 라이브러리를 설치합니다.
npm install

# 3. Vite 개발 서버를 실행합니다.
npm run dev
```

> ℹ️ **화면 접속**
>
> 실행 후 브라우저에서 `http://localhost:5173/login` 주소로 접속하세요.

<br>

## API 문서 (Swagger UI)

백엔드 애플리케이션이 실행 중일 때, 아래 주소로 접속하여 API 명세를 확인하고 테스트할 수 있습니다.

*   [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
*   [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

<br>

## 환경 변수 설정 (`application.properties`)

백엔드 프로젝트의 `src/main/resources/` 경로에 `application.properties` 파일을 생성하고, 아래 예시를 바탕으로 자신의 키와 정보를 입력해야 합니다.

<details>
<summary><strong>전체 환경 변수 예시 보기</strong></summary>

```properties
# ====================================
# 애플리케이션 기본 정보
# ====================================
spring.application.name=med
spring.security.user.name=user         # 기본 관리자 계정 (테스트용)
spring.security.user.password=1234

# ====================================
# 외부 데이터베이스(DICOM 이미지 서버)
# ====================================
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
spring.datasource.jdbc-url=jdbc:oracle:thin:@//[호스트명]:1521/XE
spring.datasource.username=[DB 사용자명]
spring.datasource.password=[DB 비밀번호]

# ====================================
# 사용자 데이터베이스(ORACLE Cloud 사용시)
# ====================================
second-datasource.driver-class-name=oracle.jdbc.OracleDriver
second-datasource.jdbc-url=jdbc:oracle:thin:@[서비스명 또는 TNS명]?TNS_ADMIN=[Wallet 경로]
second-datasource.username=[DB 사용자명]
second-datasource.password=[DB 비밀번호]

# ====================================
# HikariCP 커넥션 풀 설정
# ====================================
spring.datasource.hikari.maximum-pool-size=10      # 최대 커넥션 수
spring.datasource.hikari.minimum-idle=5            # 최소 유휴 커넥션 수
spring.datasource.hikari.idle-timeout=30000        # 유휴 커넥션 최대 유지 시간(ms)
spring.datasource.hikari.connection-timeout=20000  # 커넥션 획득 타임아웃(ms)
spring.datasource.hikari.pool-name=OracleHikariCP  # 풀 이름
spring.datasource.hikari.read-only=true            # 읽기 전용 설정

# ====================================
# MyBatis 설정
# ====================================
mybatis.mapper-locations=classpath:mapper/**/*.xml
mybatis.type-aliases-package=com.example.med.dto
mybatis.configuration.map-underscore-to-camel-case=true
mybatis.configuration.default-fetch-size=100
mybatis.configuration.default-statement-timeout=30

# ====================================
# Swagger (API 문서화)
# ====================================
springdoc.api-docs.enabled=true
springdoc.swagger-ui.enabled=true

# ====================================
# 로깅 및 디버깅
# ====================================
logging.level.org.mybatis=DEBUG
logging.level.org.apache.ibatis=DEBUG
mybatis.configuration.log-impl=org.apache.ibatis.logging.stdout.StdOutImpl

# ====================================
# JWT (토큰 인증)
# ====================================
jwt.secret=[프로젝트만의 JWT 시크릿 키]
jwt.access-token-expiration-millis=[토큰 지속 시간]         # 액세스 토큰 만료(ms)
jwt.refresh-token-expiration-millis=[토큰 지속 시간]        # 리프레시 토큰 만료(ms)

# ====================================
# PACS 이미지 서버 경로
# ====================================
pacs.image.base-path=[이미지 경로]

# ====================================
# Spring 프로파일
# ====================================
spring.profiles.active=dev

# ====================================
# DICOM 서버 기본 URI
# ====================================
dicom.base-uri=http://localhost:8080

# ====================================
# Jasypt 암호화 설정
# ====================================
jasypt.encryptor.password=[프로젝트만의 JWT 시크릿 키]
```
</details>

---

## 📁 프로젝트 산출물

프로젝트 기획부터 최종 발표까지의 모든 산출물은 아래 링크들에서 확인할 수 있습니다.

**주요 포함 내용:**
-   기획서 및 요구사항 명세서
-   시스템 아키텍처 다이어그램
-   ERD (Entity-Relationship Diagram)
-   최종 발표 자료 (PPT) 등등...

<br>

> **[📂 프로젝트 산출물 바로가기 (Google Drive)](https://drive.google.com/drive/folders/1ag1OGiUCSxSas-Zi9qiU6Ibexx6fNDeD?hl=ko)**

**UI/UX 디자인:**
> **[🎨 Figma 디자인 시안 바로가기](https://www.figma.com/design/hXgo74i9xWVHBW4PJsr4Kj/KDT_3%EC%B0%A8?m=auto&t=omF7BknhVA8gLMVu-1)**

---
