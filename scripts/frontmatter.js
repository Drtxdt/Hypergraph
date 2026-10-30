hexo.extend.filter.register("before_post_render", function (data) {
  if (data.cover_fit !== undefined && !["cover", "contain"].includes(data.cover_fit))
    throw new Error("[Hypergraph] " + (data.source || data.path || data.title) + ": cover_fit must be cover or contain");
  if (
    data.cover_mode !== undefined &&
    !["compact", "feature", "none"].includes(data.cover_mode)
  ) {
    throw new Error(
      "[Hypergraph] " +
        (data.source || data.path || data.title) +
        ": cover_mode must be compact, feature or none",
    );
  }
  return data;
});
