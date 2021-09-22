import { SpotifyAlbum, SpotifyPlaylist, SpotifyVideo } from "./classes";
export interface SpotifyDataOptions {
    client_id: string;
    client_secret: string;
    redirect_url: string;
    authorization_code?: string;
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    expiry?: number;
    market?: string;
}
export declare function spotify(url: string): Promise<SpotifyAlbum | SpotifyPlaylist | SpotifyVideo>;
export declare function sp_validate(url: string): "track" | "playlist" | "album" | boolean;
export declare function Authorization(): void;
export declare function is_expired(): boolean;
export declare function RefreshToken(): Promise<true | false>;
//# sourceMappingURL=index.d.ts.map