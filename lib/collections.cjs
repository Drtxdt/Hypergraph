"use strict";
const types = [
  "about",
  "friends",
  "gallery",
  "essay",
  "equipment",
  "music",
  "room",
  "fcircle",
  "tools",
  "games",
];
function normalize(type, input) {
  const structured = ["about", "friends", "gallery"].includes(type);
  input ??= structured ? {} : [];
  if (structured && Array.isArray(input))
    throw Error(
      `Hypergraph data /${type}: expected structured object; migrate to ${type === "about" ? "sections" : type === "friends" ? "groups" : "albums"}`,
    );
  if (Array.isArray(input))
    return {
      items: input,
      groups: type === "friends" && input.length ? [{ items: input }] : [],
      albums: [],
    };
  if (!input || typeof input !== "object")
    throw Error(`Hypergraph data /${type}: expected array or object`);
  for (const key of [
    "sections",
    "projects",
    "timeline",
    "interests",
    "links",
    "posts",
    "groups",
    "albums",
  ])
    if (input[key] !== undefined && !Array.isArray(input[key]))
      throw Error(`Hypergraph data /${type}/${key}: expected array`);
  const slugs = new Set();
  for (const album of input.albums || []) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(album.slug || "") ||
      slugs.has(album.slug)
    )
      throw Error(
        `Hypergraph data /gallery/albums: invalid or duplicate slug ${album.slug}`,
      );
    slugs.add(album.slug);
    if (!Array.isArray(album.photos))
      throw Error(
        `Hypergraph data /gallery/albums/${album.slug}/photos: expected array`,
      );
  }
  for (const group of input.groups || [])
    if (!Array.isArray(group.items))
      throw Error(`Hypergraph data /${type}/groups: items must be an array`);
  return {
    items: [],
    groups: [],
    albums: [],
    ...input,
    links: (input.links || []).map((item) => ({
      ...item,
      group: item.group || "",
    })),
  };
}
module.exports = { types, normalize };
