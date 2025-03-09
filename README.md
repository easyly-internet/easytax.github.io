# EasyTax - AI-Powered Tax Filing Platform

EasyTax is a comprehensive AI-driven tax filing and management platform designed to simplify the tax filing process for individuals and businesses in India.

## Features

- **AI-Powered Tax Filing**: Automated tax form completion with AI assistance
- **Document Management**: Secure storage and retrieval of tax documents
- **Member Management**: Complete user management with roles and permissions
- **Payment Processing**: Subscription and payment processing
- **Mobile Responsive**: Works on all devices, from desktop to mobile

## Architecture

EasyTax is built on a modern microservices architecture:

- **Frontend**: React with TypeScript
- **Auth Service**: Authentication and authorization
- **Member Service**: Member management and operations
- **Document Service**: Document management and storage
- **AI Service**: Tax filing assistance with AI
- **Payment Service**: Subscription and payment processing

## Development

### Prerequisites

- Node.js (v18+)
- Yarn
- Docker and Docker Compose
- Kubernetes (for production deployment)

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/easytax/easytax.git
   cd easytax
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the development environment:
   ```bash
   yarn dev || docker-compose up
   ```

4. Access the application:
  - Frontend: http://localhost:3000
  - API Gateway: http://localhost:8080

### Development Workflow

1. Create a feature branch from `develop`
2. Make your changes
3. Write tests for your changes
4. Submit a pull request to `develop`
5. After review, changes will be merged to `main` for deployment

## Deployment

### GitHub Pages (Frontend)

The frontend application is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

Visit: [https://easytax.github.io](https://easytax.github.io)

### Kubernetes (Backend)

Backend services are deployed to Kubernetes using Helm charts:

```bash
cd kubernetes/scripts
./deploy.sh
```

## Documentation

- [API Documentation](docs/api.md)
- [Architecture Overview](docs/architecture.md)
- [Development Guide](docs/development.md)
- [Deployment Guide](docs/deployment.md)

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.