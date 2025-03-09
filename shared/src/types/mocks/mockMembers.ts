import {Member, MemberStatus, MemberYearStatus} from "../member";

const mockMembers: Member[] = [
    {
        id: "1",
        userId: "U001",
        panNumber: "ABCDE1234F",
        fullName: "Rahul Sharma",
        email: "rahul.sharma@example.com",
        documents: [],
        financialYears: [
            {
                id: "FY001",
                memberId: "1",
                financialYear: "2022-2023",
                documents: [],
                protectedDocuments: [],
                receipts: [],
                remark: ["Good financial standing"],
                adminRemark: ["Verified"],
                status: MemberYearStatus.COMPLETED,
                createdAt: "2022-04-01",
                updatedAt: "2023-07-15",
            },
            {
                id: "FY002",
                memberId: "1",
                financialYear: "2021-2022",
                documents: [],
                protectedDocuments: [],
                receipts: [],
                remark: ["Pending tax filing"],
                adminRemark: ["Needs review"],
                status: MemberYearStatus.IN_PROGRESS,
                createdAt: "2021-04-01",
                updatedAt: "2022-07-15",
            },
        ],
        status: MemberStatus.ACTIVE, // ✅ Add this missing property
        createdAt: "2020-06-15",
        updatedAt: "2023-07-15",
    },
    {
        id: "2",
        userId: "U002",
        panNumber: "FGHIJ5678K",
        fullName: "Rutvij Patel",
        email: "priya.patel@example.com",
        documents: [],
        financialYears: [
            {
                id: "FY003",
                memberId: "2",
                financialYear: "2022-2023",
                documents: [],
                protectedDocuments: [],
                receipts: [],
                remark: ["Income verified"],
                adminRemark: ["Approved"],
                status: MemberYearStatus.COMPLETED,
                createdAt: "2022-04-01",
                updatedAt: "2023-07-12",
            },
        ],
        status: MemberStatus.ACTIVE, // ✅ Add this missing property
        createdAt: "2021-02-10",
        updatedAt: "2023-07-12",
    },
];

export default mockMembers;
