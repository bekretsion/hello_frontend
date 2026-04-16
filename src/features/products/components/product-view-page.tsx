import { fakeProducts, Product } from '@/constants/mock-api';
import { notFound } from 'next/navigation';
import ProductForm from './product-form';
import { getTranslations } from 'next-intl/server';

type TProductViewPageProps = {
  productId: string;
};

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  const t = await getTranslations('products');
  
  let product = null;
  let pageTitle = t('createNew');

  if (productId !== 'new') {
    const data = await fakeProducts.getProductById(Number(productId));
    product = data.product as Product;
    if (!product) {
      notFound();
    }
    pageTitle = t('editProduct');
  }

  return <ProductForm initialData={product} pageTitle={pageTitle} />;
}