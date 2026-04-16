'use client';

import { Product } from '@/constants/data';
import { fakeProducts } from '@/constants/mock-api';
import { ProductTable } from './product-tables';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type ProductListingPage = {};

export default function ProductListingPage({}: ProductListingPage) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Get search params from URL
        const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
        const search = searchParams.get('name');
        const pageLimit = searchParams.get('perPage') ? parseInt(searchParams.get('perPage')!) : 10;
        const categories = searchParams.get('category');

        const filters = {
          page,
          limit: pageLimit,
          ...(search && { search }),
          ...(categories && { categories: categories })
        };

        const data = await fakeProducts.getProducts(filters);
        setTotalProducts(data.total_products);
        // @ts-ignore
        setProducts(data.products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <ProductTable
      data={products}
      totalItems={totalProducts}
    />
  );
}