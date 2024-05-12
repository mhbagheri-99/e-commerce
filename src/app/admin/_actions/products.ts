"use server";

import db from "@/db/db";
import { z } from "zod";
import fs from "fs/promises";
import { notFound, redirect } from "next/navigation";

const fileSchema = z.instanceof(File, { message: "File is required" });
const imageSchema = fileSchema.refine(
  (file) => file.size === 0 || file.type.startsWith("image/"),
  "File is not an image",
);

const addSchema = z.object({
  name: z.string().min(1),
  priceInCents: z.coerce.number().int().min(1),
  description: z.string().min(1),
  file: fileSchema.refine((file) => file.size > 0, "File is empty"),
  image: imageSchema.refine((file) => file.size > 0, "File is empty"),
});

export const addProduct = async (prevState: unknown, formData: FormData) => {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    return result.error.formErrors.fieldErrors;
  }
  const data = result.data;

  await fs.mkdir("products", { recursive: true });
  const filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
  await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));

  await fs.mkdir("public/products", { recursive: true });
  const imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
  await fs.writeFile(
    `public${imagePath}`,
    Buffer.from(await data.image.arrayBuffer()),
  );

  await db.product.create({
    data: {
      name: data.name,
      priceInCents: data.priceInCents,
      description: data.description,
      filePath,
      imagePath,
      isAvailable: false,
    },
  });

  redirect("/admin/products");
};

const updateSchema = addSchema.extend({
  file: fileSchema.optional(),
  image: imageSchema.optional(),
});

export const updateProduct = async (
  id: string,
  prevState: unknown,
  formData: FormData
) => {
  const result = updateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!result.success) {
    console.log(result.error.formErrors.fieldErrors);
    return result.error.formErrors.fieldErrors;
  }
  const data = result.data;
  const currentProduct = await db.product.findUnique({
    where: { id },
  });

  if (!currentProduct) {
    return notFound();
  }

  let filePath = currentProduct.filePath;
  if (data.file && data.file.size > 0) {
    await fs.unlink(currentProduct.filePath);
    await fs.mkdir("products", { recursive: true });
    filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));
  }

  let imagePath = currentProduct.imagePath;
  if (data.image && data.image.size > 0) {
    await fs.unlink(`public${currentProduct.imagePath}`);
    await fs.mkdir("public/products", { recursive: true });
    imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
    await fs.writeFile(
      `public${imagePath}`,
      Buffer.from(await data.image.arrayBuffer()),
    );
  }

  await db.product.update({
    where: { id },
    data: {
      name: data.name,
      priceInCents: data.priceInCents,
      description: data.description,
      filePath,
      imagePath,
      isAvailable: false,
    },
  });

  redirect("/admin/products");
}

export const setProductAvailability = async (
  id: string,
  isAvailable: boolean,
) => {
  await db.product.update({
    where: { id },
    data: { isAvailable },
  });
};

export const deleteProduct = async (id: string) => {
  const product = await db.product.delete({ where: { id } });
  if (!product) {
    return notFound();
  }
  await fs.unlink(product.filePath);
  await fs.unlink(`public${product.imagePath}`);
};
