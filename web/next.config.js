export default {
  async rewrites() {
    return [{ source: "/files/:path*", destination: "/api/files/:path*" }];
  }
};