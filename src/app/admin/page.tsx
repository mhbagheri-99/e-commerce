import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import db from "@/db/db";
import { formatCurrency, formatNumber } from "@/lib/formatters";

const getSalesData = async () => {
  const data = await db.order.aggregate({
    _sum: { totalInCents: true },
    _count: true,
  })
  return {
    amount: (data._sum.totalInCents ?? 0) / 100,
    numberOfSales: data._count,
  };
}

const getCustomersData = async () => {
  const [customerCount, orderData] = await Promise.all([
    db.user.count(),
    db.order.aggregate({
      _sum: { totalInCents: true },
    })
  ]);
  return {
    customerCount,
    averageTotalSales: customerCount === 0 ? 0 : (orderData._sum.totalInCents ?? 0) / 100 / customerCount,
  };
}

const getProductsData = async () => {
  const [activeProductsCount, inactiveProductsCount] = await Promise.all([
    db.product.count({ where: { isAvailable: true } }),
    db.product.count({ where: { isAvailable: false } }),
    ]);
  return {
    activeProductsCount,
    inactiveProductsCount,
  };
}

const AdminDashboard = async () => {

  const [salesData, customersData, productsData] = await Promise.all([ 
    getSalesData(),
    getCustomersData(),
    getProductsData(),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard
        title="Sales"
        description={`${formatNumber(salesData.numberOfSales)} orders`}
        content={formatCurrency(salesData.amount)}
      />
      <DashboardCard
        title="Active Products"
        description={`${formatNumber(productsData.inactiveProductsCount)} inactive`}
        content={`${formatNumber(productsData.activeProductsCount)} active`}
      />
      <DashboardCard
        title="Customers"
        description={`${formatNumber(customersData.customerCount)} customers`}
        content={`${formatCurrency(customersData.averageTotalSales)} average total sales per customer`}
      />
    </div>
  );
};

export default AdminDashboard;

const DashboardCard = ({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: React.ReactNode;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
