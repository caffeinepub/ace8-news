import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  pubTimestamp: bigint;
  sourceName: string;
  imageUrl: string;
  category: string;
  language: string;
}

export interface backendInterface {
  getArticles: (category: string, language: string) => Promise<Article[]>;
  getBreakingNews: (language: string) => Promise<Article[]>;
  getLastUpdated: () => Promise<bigint>;
  getStatus: () => Promise<string>;
  refreshFeeds: () => Promise<void>;
}
