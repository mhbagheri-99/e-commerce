import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
} from "@react-email/components"
import OrderInfo from "./components/OrderInfo"

type PurchaseReceiptEmailProps = {
  product: {
    name: string
    imagePath: string
    description: string
  }
  order: { id: string; createdAt: Date; totalInCents: number }
  downloadVerificationId: string
}

const PurchaseReceipt = ({
  product,
  order,
  downloadVerificationId,
}: PurchaseReceiptEmailProps) => {
  return (
    <Html>
      <Preview>Download {product.name} and view receipt</Preview>
      <Tailwind>
        <Head />
        <Body className="font-sans bg-white">
          <Container className="max-w-xl">
            <Heading className="text-2xl">Purchase Receipt</Heading>
            <OrderInfo 
              order={order}
              product={product}
              downloadVerificationId={downloadVerificationId}
            />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default PurchaseReceipt

PurchaseReceipt.PreviewProps = {
  product: {
    name: "Product name",
    description: "Some description",
    imagePath:
      "/products/a9bd13ee-e0c0-464c-bdf7-f2a9818aebfb-spritesheet.png",
  },
  order: {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    totalInCents: 10000,
  },
  downloadVerificationId: crypto.randomUUID(),
} satisfies PurchaseReceiptEmailProps