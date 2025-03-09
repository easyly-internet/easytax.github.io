taxsahihai/
├── README.md
├── docker-compose.yml       # For local development
├── .github/                 # CI/CD workflows
│   └── workflows/
│       ├── build.yml
│       └── deploy.yml
├── kubernetes/              # K8s deployment files
│   ├── charts/              # Helm charts
│   │   └── taxsahihai/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       └── templates/
│   │           ├── deployment.yaml
│   │           ├── service.yaml
│   │           └── ingress.yaml
│   └── scripts/             # Deployment scripts
│       └── deploy.sh
├── frontend/                # React TypeScript frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   └── src/
│       ├── App.tsx
│       ├── index.tsx
│       ├── assets/          # Images, icons, etc.
│       ├── components/      # React components
│       │   ├── common/      # Reusable components
│       │   ├── Dashboard/   # Dashboard components
│       │   ├── Members/     # Member management
│       │   ├── AITaxFiling/ # AI tax filing components
│       │   ├── Documents/   # Document management
│       │   └── Auth/        # Authentication components
│       ├── context/         # React context providers
│       ├── hooks/           # Custom React hooks
│       ├── layouts/         # Page layouts
│       ├── pages/           # Page components
│       ├── routes/          # Routing configuration
│       ├── services/        # API services
│       ├── store/           # State management
│       ├── styles/          # Global styles
│       ├── types/           # TypeScript type definitions
│       └── utils/           # Utility functions
├── services/                # Backend microservices
│   ├── auth-service/        # Authentication service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── logger.tsx
│   │       ├── controllers/
│   │       ├── middleware/
│   │       ├── models/
│   │       ├── routes/
│   │       └── utils/
│   ├── member-service/      # Member management service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/             # Similar structure as auth-service
│   ├── document-service/    # Document management service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/             # Similar structure as auth-service
│   ├── ai-service/          # AI tax filing service
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/             # Similar structure plus AI-specific utils
│   └── payment-service/     # Payment processing service
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       └── src/             # Similar structure as auth-service
└── shared/                  # Shared code and utilities
├── package.json
├── tsconfig.json
└── src/
├── constants/       # Shared constants
├── types/           # Shared type definitions
└── utils/           # Shared utility functions