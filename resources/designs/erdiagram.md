erDiagram
Users {
string id PK
string email
string fullName
string hashedPassword
string role
timestamp createdAt
timestamp updatedAt
}

    Members {
        string id PK
        string userId FK
        string panNumber
        string fullName
        string email
        string mobileNo
        string aadharCard
        string status
        date lastUploadedDate
        string caReferenceId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    FinancialYears {
        string id PK
        string memberId FK
        string year
        string status
        number taxRefund
        number fees
        timestamp createdAt
        timestamp updatedAt
    }
    
    Documents {
        string id PK
        string financialYearId FK
        string memberId FK
        string type
        string fileKey
        string status
        timestamp uploadedAt
        timestamp createdAt
        timestamp updatedAt
    }
    
    CAs {
        string id PK
        string userId FK
        string name
        string firmName
        string licenseNumber
        string mobileNo
        string status
        timestamp createdAt
        timestamp updatedAt
    }
    
    Subscriptions {
        string id PK
        string memberId FK
        string plan
        date startDate
        date endDate
        boolean autoRenew
        number amount
        string paymentId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    Payments {
        string id PK
        string memberId FK
        string type
        string status
        number amount
        string transactionId
        string paymentMethod
        timestamp paidAt
        timestamp createdAt
        timestamp updatedAt
    }
    
    TaxAnalyses {
        string id PK
        string memberId FK
        string financialYearId FK
        string regime
        number totalIncome
        number totalDeductions
        number taxableIncome
        number calculatedTax
        number taxPaid
        number remainingTax
        timestamp createdAt
        timestamp updatedAt
    }
    
    AIQueries {
        string id PK
        string memberId FK
        string query
        string response
        timestamp createdAt
        timestamp updatedAt
    }
    
    ActivityLogs {
        string id PK
        string userId FK
        string action
        string entity
        string entityId
        timestamp createdAt
    }
    
    Users ||--o{ Members : "has"
    Users ||--o{ CAs : "has"
    Members ||--o{ FinancialYears : "has"
    FinancialYears ||--o{ Documents : "contains"
    Members ||--o{ Subscriptions : "has"
    Members ||--o{ Payments : "makes"
    Members ||--o{ TaxAnalyses : "has"
    Members ||--o{ AIQueries : "makes"
    CAs ||--o{ Members : "manages"
    Users ||--o{ ActivityLogs : "generates"