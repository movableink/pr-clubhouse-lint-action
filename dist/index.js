/******/ var __webpack_modules__ = ({

/***/ 328:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 672:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXTERNAL MODULE: ../../usr/local/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/github
var github = __nccwpck_require__(672);
// EXTERNAL MODULE: ../../usr/local/lib/node_modules/@vercel/ncc/dist/ncc/@@notfound.js?@actions/core
var core = __nccwpck_require__(328);
;// CONCATENATED MODULE: ./lib/action.js


// Matches
// [ch49555] or [sc-49555] or [sc49555] ticket reference
// ch49555/branch-name or sc49555/branch-name or sc-49555/branch-name
const shortcutRegex = /(\[ch\d+\])|(ch\d+\/)|(\[sc\d+\])|(sc\d+\/)|(\[sc-\d+\])|(sc-\d+\/)/;

// We need to be able to identify old checks to neutralize them,
// unfortunately the only way is to name them with one of these:
const jobNames = ['Shortcut', 'Check for story ID'];

/* harmony default export */ async function action(context, api) {
  const { repository, pull_request } = context.payload;

  const approvedBots = core.getInput('approved-bots')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const prAuthor = pull_request.user && pull_request.user.login;

  if (approvedBots.length > 0 && approvedBots.includes(prAuthor)) {
    console.log(`Bypassing check for approved bot: ${prAuthor}`);
    return;
  }

  const repoInfo = {
    owner: repository.owner.login,
    repo: repository.name,
    ref: pull_request.head.ref
  };

  const toSearch = [];

  const { title, body } = pull_request;

  toSearch.push(`PR title: ${title}`);
  toSearch.push(`PR body: ${body}`);

  const headBranch = pull_request.head.ref.toLowerCase();

  toSearch.push(`Branch name: ${headBranch}`);

  const passed = toSearch.some(line => {
    const linePassed = !!line.match(shortcutRegex);
    console.log(`Searching ${line}...${linePassed}`);
    return linePassed;
  });

  console.log(`Passed shortcut number check: ${passed}`);

  if (!passed) {
    core.setFailed('PR Linting Failed');
  }

  if (process.env.GITHUB_TOKEN) {
    // If there are any previously failed CH checks, set them to neutral
    // since we want this check to override those.
    const checkList = await api.rest.checks.listForRef(repoInfo);
    const { check_runs } = checkList.data;

    const shortcutChecks = check_runs.filter(r => jobNames.includes(r.name));
    const completedChecks = shortcutChecks.filter(r => r.status === 'completed');

    for (let check of completedChecks) {
      console.log(`Updating ${check.id} check to neutral status`);

      await api.rest.checks.update({
        ...repoInfo,
        check_run_id: check.id,
        conclusion: 'neutral'
      });
    }
  }
};

;// CONCATENATED MODULE: ./src/index.js



action(github.context, (0,github.getOctokit)(process.env.GITHUB_TOKEN));

