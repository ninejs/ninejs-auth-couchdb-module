/// <reference types="node" />
import { HexBase64Latin1Encoding } from "crypto";
export default function hashMethod(method?: string, encoding?: HexBase64Latin1Encoding): (username: string, password: string) => string;
