const evidencedCache = new WeakMap();

function evidencedSkillSet(sources) {
  if (!Array.isArray(sources)) {
    return new Set();
  }
  if (evidencedCache.has(sources)) {
    return evidencedCache.get(sources);
  }
  const set = new Set();
  sources.forEach(function (entry) {
    (entry.bullets || []).forEach(function (bullet) {
      (bullet.skills || []).forEach(function (skill) {
        set.add(skill);
      });
    });
  });
  evidencedCache.set(sources, set);
  return set;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.setNunjucksEnvironmentOptions({
    trimBlocks: true,
    lstripBlocks: true,
  });

  eleventyConfig.addFilter("isEvidenced", function (skill, sources) {
    return evidencedSkillSet(sources).has(skill);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts",
    },
  };
};
