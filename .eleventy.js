const evidencedCache = new WeakMap();

function evidencedSkillSet(experience) {
  if (!Array.isArray(experience)) {
    return new Set();
  }
  if (evidencedCache.has(experience)) {
    return evidencedCache.get(experience);
  }
  const set = new Set();
  experience.forEach(function (job) {
    (job.bullets || []).forEach(function (bullet) {
      (bullet.skills || []).forEach(function (skill) {
        set.add(skill);
      });
    });
  });
  evidencedCache.set(experience, set);
  return set;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.setNunjucksEnvironmentOptions({
    trimBlocks: true,
    lstripBlocks: true,
  });

  eleventyConfig.addFilter("isEvidenced", function (skill, experience) {
    return evidencedSkillSet(experience).has(skill);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts",
    },
  };
};
