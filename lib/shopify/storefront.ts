import { unstable_cache } from "next/cache";

import type {
  ShopifyArticleDetail,
  ShopifyArticleSummary,
  ShopifyCollectionSummary,
  ShopifyProductSummary
} from "@/types/domain";
import { logEvent } from "@/lib/observability/logger";
import { programs as fallbackPrograms } from "@/lib/content/site-content";
import { isShopifyStorefrontConfigured, shopifyConfig } from "@/lib/shopify/config";

const SHOPIFY_CONTENT_REVALIDATE_SECONDS = 300;

export const SHOPIFY_CACHE_TAGS = {
  all: "shopify:all",
  products: "shopify:products",
  collections: "shopify:collections",
  articles: "shopify:articles"
} as const;

type StorefrontResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type ProductConnectionResponse = {
  products: {
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      description: string;
      featuredImage: { url: string; altText: string | null } | null;
      priceRange: {
        minVariantPrice: {
          amount: string;
          currencyCode: string;
        };
      };
      collections: {
        nodes: Array<{ title: string }>;
      };
    }>;
  };
};

type CollectionConnectionResponse = {
  collections: {
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      description: string;
      image: { url: string; altText: string | null } | null;
      products: {
        nodes: Array<{ title: string }>;
      };
    }>;
  };
};

type ArticleConnectionResponse = {
  articles: {
    nodes: Array<{
      id: string;
      title: string;
      handle: string;
      excerpt: string | null;
      contentHtml: string;
      publishedAt: string;
      blog: { handle: string; title: string };
      authorV2: { name: string } | null;
      image: { url: string; altText: string | null } | null;
    }>;
  };
};

type ArticleByHandleResponse = {
  blog: {
    title: string;
    handle: string;
    articleByHandle: {
      id: string;
      title: string;
      handle: string;
      excerpt: string | null;
      contentHtml: string;
      publishedAt: string;
      authorV2: { name: string } | null;
      image: { url: string; altText: string | null } | null;
    } | null;
  } | null;
};

type StorefrontOptions = {
  tags: string[];
  revalidate?: number;
};

function getStorefrontUrl() {
  return `https://${shopifyConfig.storeDomain}/api/${shopifyConfig.storefrontApiVersion}/graphql.json`;
}

function getPriceLabel(amount: string, currencyCode: string) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return amount;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode
  }).format(numericAmount);
}

function normalizeText(text: string | null | undefined, fallback: string) {
  const value = text?.trim();
  return value && value.length > 0 ? value : fallback;
}

async function storefrontFetch<TData>(
  query: string,
  variables: Record<string, unknown>,
  options: StorefrontOptions
) {
  if (!isShopifyStorefrontConfigured()) {
    return null;
  }

  const response = await fetch(getStorefrontUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": shopifyConfig.storefrontToken
    },
    body: JSON.stringify({ query, variables }),
    cache: "force-cache",
    next: {
      revalidate: options.revalidate ?? SHOPIFY_CONTENT_REVALIDATE_SECONDS,
      tags: [SHOPIFY_CACHE_TAGS.all, ...options.tags]
    }
  });

  if (!response.ok) {
    const body = await response.text();
    logEvent("error", "shopify.storefront", "Storefront API request failed.", {
      status: response.status,
      body
    });
    throw new Error(`Shopify storefront request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as StorefrontResponse<TData>;

  if (payload.errors?.length) {
    logEvent("error", "shopify.storefront", "Storefront API returned GraphQL errors.", {
      errors: payload.errors
    });
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload.data ?? null;
}

function mapFallbackPrograms(): ShopifyProductSummary[] {
  return fallbackPrograms.map((program) => ({
    id: program.href,
    title: program.title,
    handle: program.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: program.description,
    price: program.price,
    cta: program.cta,
    href: program.href,
    badge: program.badge,
    featuredImageUrl: null,
    featuredImageAlt: null,
    collectionTitles: []
  }));
}

function mapProduct(product: ProductConnectionResponse["products"]["nodes"][number]): ShopifyProductSummary {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: normalizeText(product.description, "Explore this personalized learning offer from Universal Learner."),
    price: getPriceLabel(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode),
    cta: "View Program",
    href: `https://${shopifyConfig.storeDomain}/products/${product.handle}`,
    featuredImageUrl: product.featuredImage?.url ?? null,
    featuredImageAlt: product.featuredImage?.altText ?? product.title,
    badge: product.collections.nodes[0]?.title ?? undefined,
    collectionTitles: product.collections.nodes.map((collection) => collection.title)
  };
}

function mapCollection(collection: CollectionConnectionResponse["collections"]["nodes"][number]): ShopifyCollectionSummary {
  return {
    id: collection.id,
    title: collection.title,
    handle: collection.handle,
    description: normalizeText(collection.description, "A curated collection of Universal Learner programs and offers."),
    href: `https://${shopifyConfig.storeDomain}/collections/${collection.handle}`,
    imageUrl: collection.image?.url ?? null,
    imageAlt: collection.image?.altText ?? collection.title,
    productCountLabel:
      collection.products.nodes.length > 0
        ? `${collection.products.nodes.length}+ featured program${collection.products.nodes.length === 1 ? "" : "s"}`
        : "Explore the collection",
    featuredProductTitles: collection.products.nodes.map((product) => product.title)
  };
}

function mapArticle(article: ArticleConnectionResponse["articles"]["nodes"][number]): ShopifyArticleSummary {
  return {
    id: article.id,
    title: article.title,
    handle: article.handle,
    blogHandle: article.blog.handle,
    excerpt: normalizeText(article.excerpt, "Read the latest insight from Universal Learner."),
    publishedAt: article.publishedAt,
    author: article.authorV2?.name ?? null,
    imageUrl: article.image?.url ?? null,
    imageAlt: article.image?.altText ?? article.title,
    href: `/insights/${article.blog.handle}/${article.handle}`
  };
}

function mapArticleDetail(
  blogHandle: string,
  blogTitle: string,
  article: NonNullable<ArticleByHandleResponse["blog"]>["articleByHandle"]
): ShopifyArticleDetail {
  if (!article) {
    throw new Error("Article not found.");
  }

  return {
    id: article.id,
    title: article.title,
    handle: article.handle,
    blogHandle,
    blogTitle,
    excerpt: normalizeText(article.excerpt, "Read the latest insight from Universal Learner."),
    contentHtml: article.contentHtml,
    publishedAt: article.publishedAt,
    author: article.authorV2?.name ?? null,
    imageUrl: article.image?.url ?? null,
    imageAlt: article.image?.altText ?? article.title,
    href: `/insights/${blogHandle}/${article.handle}`
  };
}

const PRODUCTS_QUERY = `#graphql
  query StorefrontProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        handle
        description
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        collections(first: 3) {
          nodes {
            title
          }
        }
      }
    }
  }
`;

const COLLECTIONS_QUERY = `#graphql
  query StorefrontCollections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        title
        handle
        description
        image {
          url
          altText
        }
        products(first: 3) {
          nodes {
            title
          }
        }
      }
    }
  }
`;

const ARTICLES_QUERY = `#graphql
  query StorefrontArticles($first: Int!) {
    articles(first: $first) {
      nodes {
        id
        title
        handle
        excerpt
        contentHtml
        publishedAt
        blog {
          handle
          title
        }
        authorV2 {
          name
        }
        image {
          url
          altText
        }
      }
    }
  }
`;

const ARTICLE_BY_HANDLE_QUERY = `#graphql
  query StorefrontArticleByHandle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      title
      handle
      articleByHandle(handle: $articleHandle) {
        id
        title
        handle
        excerpt
        contentHtml
        publishedAt
        authorV2 {
          name
        }
        image {
          url
          altText
        }
      }
    }
  }
`;

async function fetchProducts(limit: number) {
  if (!isShopifyStorefrontConfigured()) {
    return mapFallbackPrograms();
  }

  try {
    const data = await storefrontFetch<ProductConnectionResponse>(PRODUCTS_QUERY, { first: limit }, { tags: [SHOPIFY_CACHE_TAGS.products] });
    return data?.products.nodes.map(mapProduct) ?? [];
  } catch (error) {
    logEvent("warn", "shopify.storefront", "Falling back to static product cards after Storefront API failure.", {
      error: error instanceof Error ? error.message : String(error)
    });
    return mapFallbackPrograms();
  }
}

async function fetchCollections(limit: number) {
  if (!isShopifyStorefrontConfigured()) {
    return [] satisfies ShopifyCollectionSummary[];
  }

  try {
    const data = await storefrontFetch<CollectionConnectionResponse>(COLLECTIONS_QUERY, { first: limit }, { tags: [SHOPIFY_CACHE_TAGS.collections] });
    return data?.collections.nodes.map(mapCollection) ?? [];
  } catch (error) {
    logEvent("warn", "shopify.storefront", "Falling back to empty collection state after Storefront API failure.", {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}

async function fetchArticles(limit: number) {
  if (!isShopifyStorefrontConfigured()) {
    return [] satisfies ShopifyArticleSummary[];
  }

  try {
    const data = await storefrontFetch<ArticleConnectionResponse>(ARTICLES_QUERY, { first: limit }, { tags: [SHOPIFY_CACHE_TAGS.articles] });
    return (data?.articles.nodes ?? [])
      .slice()
      .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
      .map(mapArticle);
  } catch (error) {
    logEvent("warn", "shopify.storefront", "Falling back to empty article state after Storefront API failure.", {
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}

async function fetchArticleByHandle(blogHandle: string, articleHandle: string) {
  if (!isShopifyStorefrontConfigured()) {
    return null;
  }

  try {
    const data = await storefrontFetch<ArticleByHandleResponse>(
      ARTICLE_BY_HANDLE_QUERY,
      { blogHandle, articleHandle },
      { tags: [SHOPIFY_CACHE_TAGS.articles] }
    );

    if (!data?.blog?.articleByHandle) {
      return null;
    }

    return mapArticleDetail(blogHandle, data.blog.title, data.blog.articleByHandle);
  } catch (error) {
    logEvent("warn", "shopify.storefront", "Article detail request failed.", {
      blogHandle,
      articleHandle,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

export const getFeaturedStorefrontProducts = unstable_cache(
  async (limit = 6) => fetchProducts(limit),
  ["shopify-storefront-products"],
  { revalidate: SHOPIFY_CONTENT_REVALIDATE_SECONDS, tags: [SHOPIFY_CACHE_TAGS.all, SHOPIFY_CACHE_TAGS.products] }
);

export const getFeaturedStorefrontCollections = unstable_cache(
  async (limit = 4) => fetchCollections(limit),
  ["shopify-storefront-collections"],
  { revalidate: SHOPIFY_CONTENT_REVALIDATE_SECONDS, tags: [SHOPIFY_CACHE_TAGS.all, SHOPIFY_CACHE_TAGS.collections] }
);

export const getLatestStorefrontArticles = unstable_cache(
  async (limit = 6) => fetchArticles(limit),
  ["shopify-storefront-articles"],
  { revalidate: SHOPIFY_CONTENT_REVALIDATE_SECONDS, tags: [SHOPIFY_CACHE_TAGS.all, SHOPIFY_CACHE_TAGS.articles] }
);

export const getStorefrontArticleByHandle = unstable_cache(
  async (blogHandle: string, articleHandle: string) => fetchArticleByHandle(blogHandle, articleHandle),
  ["shopify-storefront-article-by-handle"],
  { revalidate: SHOPIFY_CONTENT_REVALIDATE_SECONDS, tags: [SHOPIFY_CACHE_TAGS.all, SHOPIFY_CACHE_TAGS.articles] }
);

export async function getShopifyMarketingContent() {
  const [products, collections, articles] = await Promise.all([
    getFeaturedStorefrontProducts(6),
    getFeaturedStorefrontCollections(4),
    getLatestStorefrontArticles(3)
  ]);

  return {
    products,
    collections,
    articles,
    isLive: isShopifyStorefrontConfigured()
  };
}
