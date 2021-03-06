app.factory('mapFact', function ($rootScope, $http, $q) {
    String.prototype.capit = function () {
        return this.slice(0, 1).toUpperCase() + this.slice(1);
    };
    var smoothAmt = 100,
        countries = [
            //different combinations of the following array elements are used to generate country names.
            ["b", "c", "d", "f", "g", "h", "i", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z", "", "", "", "", ""],
            ["a", "e", "i", "o", "u"],
            ["br", "cr", "dr", "fr", "gr", "pr", "str", "tr", "bl", "cl", "fl", "gl", "pl", "sl", "sc", "sk", "sm", "sn", "sp", "st", "sw", "ch", "sh", "th", "wh"],
            ["ae", "ai", "ao", "au", "a", "ay", "ea", "ei", "eo", "eu", "e", "ey", "ua", "ue", "ui", "uo", "u", "uy", "ia", "ie", "iu", "io", "iy", "oa", "oe", "ou", "oi", "o", "oy"],
            ["stan", "dor", "vania", "nia", "lor", "cor", "dal", "bar", "sal", "ra", "la", "lia", "jan", "rus", "ze", "tan", "wana", "sil", "so", "na", "le", "bia", "ca", "ji", "ce", "ton", "ssau", "sau", "sia", "ca", "ya", "ye", "yae", "tho", "stein", "ria", "nia", "burg", "nia", "gro", "que", "gua", "qua", "rhiel", "cia", "les", "dan", "nga", "land"],
            ["ia", "a", "en", "ar", "istan", "aria", "ington", "ua", "ijan", "ain", "ium", "us", "esh", "os", "ana", "il", "ad", "or", "ea", "eau", "ax", "on", "ana", "ary", "ya", "ye", "yae", "ait", "ein", "urg", "al", "ines", "ela"]
        ],
        countryPrefs = ['Republic of', 'Kingdom of', 'Empire of', 'United Lands of', 'Dominion of', 'Holy empire of'],
        biomeTypes = {
            warm: ['city', 'swamp', 'forest', 'plains', 'hills'],
            cold: ['frozen city', 'frozen swamp', 'boreal forest', 'tundra', 'mountain']
        },
        doneCouns = [],
        currCont = [],
        allConts = [],
        justCouns = [];

    return {
        loadMaps: function () {
            // load all maps so we can pick one.
            return $http.get('/map/loadMaps').then(function (r) {
                return r;
            });
        },
        loadOneMap: function (id) {
            console.log('attempting to get map', id);
            return $http.get('/map/loadMap/' + id).then(function (r) {
                return r;
            });
        },
        isBorderNeighbor: function (c, s, d) {
            //OLD VERSION of isNeighbor, only returns true if start and destination are immediate neigbors
            //c: cells (array), s: start cell, d: destination cell
            if (!c[s] || !c[d]) {
                throw new Error('cells not found!');
            }
            console.log('Cells', c, 'source cell', c[s], 'target', c[d]);
            for (var i = 0; i < c[s].halfedges.length; i++) {
                if (!c[s].halfedges[i].edge.lSite || !c[s].halfedges[i].edge.rSite) {
                    continue;
                }
                if ((c[s].halfedges[i].edge.lSite.x == c[d].site.x && c[s].halfedges[i].edge.lSite.y == c[d].site.y) || (c[s].halfedges[i].edge.rSite.x == c[d].site.x && c[s].halfedges[i].edge.rSite.y == c[d].site.y)) {
                    return true;
                }
            }
            return false;
        },
        isWater: function (c, x, y) {
            //test if a cell at point (x,y) is water (i.e., isLand==false)
            for (var i = 0; i < c.length; i++) {
                if (c[i].site.x == x && c[i].site.y == y && !c[i].isLand) {
                    return i;
                }
            }
            return false;
        },
        isNeighbor: function (c, s, d) {
            //detect if start is either A) an immediate neighbor or B) immediately across the water from dest
            //c: cells (array), s: start cell, d: destination cell
            if (!c[s] || !c[d]) {
                //error reading cells, not found
                throw new Error('cells not found!');
            }
            //all stuff should 'exist' now. We can continue
            var startSite = {
                    x: c[s].site.x,
                    y: c[s].site.y
                },
                testSite = {
                    x: null,
                    y: null
                },
                surroundingOceanCandidates = [];
            for (var i = 0; i < c[s].halfedges.length; i++) {
                if (!c[s].halfedges[i].edge.lSite || !c[s].halfedges[i].edge.rSite) {
                    //edges we're lookin at don't exist
                    continue;
                }
                if (c[s].halfedges[i].edge.lSite.x == startSite.x && c[s].halfedges[i].edge.lSite.y == startSite.y) {
                    //left side is origin
                    testSite.x = c[s].halfedges[i].edge.rSite.x;
                    testSite.y = c[s].halfedges[i].edge.rSite.y;
                } else {
                    testSite.x = c[s].halfedges[i].edge.lSite.x;
                    testSite.y = c[s].halfedges[i].edge.lSite.y;
                }
                // console.log('Cell edge', i, c[s].halfedges[i], 'other side is', i, angular.element('body').scope().map.diagram.cells[angular.element('body').scope().map.cellByPoint(c[s].halfedges[i].edge.lSite.x, c[s].halfedges[i].edge.lSite.y)])
                if (testSite.x == c[d].site.x && testSite.y == c[d].site.y) {
                    return true;
                } else {
                    surroundingOceanCandidates.push(this.isWater(c, testSite.x, testSite.y));
                }
            }
            //finished testing immediate neighbors. Now test ocean neighbors
            for (i = 0; i < surroundingOceanCandidates.length; i++) {
                if (surroundingOceanCandidates[i] || surroundingOceanCandidates[i] === 0) {
                    //ocean, test
                    startSite.x = c[surroundingOceanCandidates[i]].site.x;
                    startSite.y = c[surroundingOceanCandidates[i]].site.y;
                    for (var j = 0; j < c[surroundingOceanCandidates[i]].halfedges.length; j++) {
                        if (!c[surroundingOceanCandidates[i]].halfedges[j].edge.lSite || !c[surroundingOceanCandidates[i]].halfedges[j].edge.rSite) {
                            //edges we're lookin at don't exist
                            continue;
                        }
                        if (c[surroundingOceanCandidates[i]].halfedges[j].edge.lSite.x == startSite.x && c[surroundingOceanCandidates[i]].halfedges[j].edge.lSite.y == startSite.y) {
                            //left side is origin
                            testSite.x = c[surroundingOceanCandidates[i]].halfedges[j].edge.rSite.x;
                            testSite.y = c[surroundingOceanCandidates[i]].halfedges[j].edge.rSite.y;
                        } else {
                            testSite.x = c[surroundingOceanCandidates[i]].halfedges[j].edge.lSite.x;
                            testSite.y = c[surroundingOceanCandidates[i]].halfedges[j].edge.lSite.y;
                        }
                        if (testSite.x == c[d].site.x && testSite.y == c[d].site.y) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },
        delMap: function (id) {
            return $http.delete('/map/del/' + id, function (r) {
                return r;
            });
        },
        GetVoronoi: function (hi, wid, numCells, schmooz) {
            var newVor = {
                voronoi: new Voronoi(),
                diagram: null,
                margin: 0.1,
                canvas: null,
                bbox: {
                    xl: 0,
                    xr: wid,
                    yt: 0,
                    yb: hi
                },
                sites: [],
                countryNames: [],
                cellCenters: [],
                timeoutDelay: 30,
                numsRelaxed: 100,
                init: function () {
                    this.canvas = document.querySelector('canvas');
                    this.clearMap();
                    this.randomSites(numCells, true);
                },
                save: function () {
                    // note: this function is for saving a map. it is NOT for saving a game!
                    var mapData = {
                        countryNames: this.countryNames,
                        bbox: this.bbox,
                        sites: this.sites,
                        numsRelaxed: this.numsRelaxed,
                        diagram: this.diagram,
                        doneCouns: doneCouns,
                        currCont: currCont,
                        cellCenters: this.cellCenters,
                        img: this.canvas.toDataURL()
                    };
                    console.log('TO SAVE:', mapData);
                    return $http.post('/map/newMap', mapData).then(function (r) {
                        return r;
                    });
                },
                clearSites: function () {
                    this.compute([]);
                },

                randomSites: function (n, clear) {
                    var sites = [];
                    if (!clear) {
                        sites = this.sites.slice(0);
                    }
                    // create vertices
                    var xmargin = this.canvas.width * this.margin,
                        ymargin = this.canvas.height * this.margin,
                        xo = xmargin,
                        dx = this.canvas.width - xmargin * 2,
                        yo = ymargin,
                        dy = this.canvas.height - ymargin * 2;
                    for (var i = 0; i < n; i++) {
                        sites.push({
                            x: self.Math.round((xo + self.Math.random() * dx) * 10) / 10,
                            y: self.Math.round((yo + self.Math.random() * dy) * 10) / 10
                        });
                    }
                    this.compute(sites);
                    // relax sites
                    if (this.timeout) {
                        clearTimeout(this.timeout);
                        this.timeout = null;
                    }
                    var me = this;
                    this.timeout = setTimeout(function () {
                        me.relaxSites();
                    }, this.timeoutDelay);
                },

                relaxSites: function () {
                    if (!this.diagram) {
                        return;
                    }
                    var cells = this.diagram.cells,
                        iCell = cells.length,
                        cell,
                        site, sites = [],
                        again = false,
                        rn, dist;
                    var p = 1 / iCell * 0.1;
                    while (iCell--) {
                        cell = cells[iCell];
                        rn = Math.random();
                        // probability of apoptosis
                        if (rn < p) {
                            continue;
                        }
                        site = this.cellCentroid(cell);
                        dist = this.distance(site, cell.site);
                        this.numsRelaxed -= 1 / (numCells / schmooz);
                        again = this.numsRelaxed > 0;
                        // don't relax too fast
                        if (dist > 2) {
                            site.x = (site.x + cell.site.x) / 2;
                            site.y = (site.y + cell.site.y) / 2;
                        }
                        // probability of mitosis
                        if (rn > (1 - p)) {
                            dist /= 2;
                            sites.push({
                                x: site.x + (site.x - cell.site.x) / dist,
                                y: site.y + (site.y - cell.site.y) / dist,
                            });
                        }
                        sites.push(site);
                    }
                    this.compute(sites);
                    if (again) {
                        var me = this;
                        this.timeout = setTimeout(function () {
                            me.relaxSites();
                        }, this.timeoutDelay);
                    } else {
                        this.render();

                    }
                },
                doCellSites: function () {
                    this.diagram.cells.forEach((c) => {
                        if (c.name || c.country) {
                            this.cellCenters.push({
                                x: c.site.x,
                                y: c.site.y,
                                name: c.name || c.country,
                                terr: c.terrType || 'plains'
                            });
                        }
                    });
                },
                initLoad: function (im) {
                    //simply redraw an old map on canvas.
                    this.canvas = document.querySelector('canvas');
                    this.clearMap();
                    this.getCellNames();
                    var ctx = this.canvas.getContext('2d'),
                        img = new Image(),
                        canv = this.canvas;
                    img.onload = function () {
                        canv.width = img.width;
                        canv.height = img.height;
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = im;
                },
                makeAName: function () {
                    /*name patterns (from http://fantasynamegenerators.com/scripts/landNames.js):
                    0,1,2,3,4
                    0,1,2,5
                    2,3,4
                    1,2,5
                    2,3,0,2,5
                    */
                    var nm = '';
                    var whichPtrn = Math.floor(Math.random() * 5);
                    switch (whichPtrn) {
                        case 0:
                            nm = countries[0][Math.floor(Math.random() * countries[0].length)] + countries[1][Math.floor(Math.random() * countries[1].length)] + countries[2][Math.floor(Math.random() * countries[2].length)] + countries[3][Math.floor(Math.random() * countries[3].length)] + countries[4][Math.floor(Math.random() * countries[4].length)];
                            break;
                        case 1:
                            nm = countries[0][Math.floor(Math.random() * countries[0].length)] + countries[1][Math.floor(Math.random() * countries[1].length)] + countries[2][Math.floor(Math.random() * countries[2].length)] + countries[5][Math.floor(Math.random() * countries[5].length)];
                            break;
                        case 2:
                            nm = countries[2][Math.floor(Math.random() * countries[2].length)] + countries[3][Math.floor(Math.random() * countries[3].length)] + countries[4][Math.floor(Math.random() * countries[4].length)];
                            break;
                        case 3:
                            nm = countries[1][Math.floor(Math.random() * countries[1].length)] + countries[2][Math.floor(Math.random() * countries[2].length)] + countries[5][Math.floor(Math.random() * countries[5].length)];
                            break;
                        default:
                            nm = countries[2][Math.floor(Math.random() * countries[2].length)] + countries[3][Math.floor(Math.random() * countries[3].length)] + countries[0][Math.floor(Math.random() * countries[0].length)] + countries[2][Math.floor(Math.random() * countries[2].length)] + countries[5][Math.floor(Math.random() * countries[5].length)];
                    }
                    return nm;
                },
                makeCellNames: function () {
                    console.log('CELL LENGTH', this.diagram.cells.length)
                    for (var n = 0; n < this.diagram.cells.length; n++) {
                        var cell = this.diagram.cells[n];
                        var newName = null;
                        if (cell.isLand) {
                            var isUnique = false;
                            while (!isUnique) {
                                // newName = countries.names[Math.floor(Math.random() * countries.names.length)];
                                newName = this.makeAName().capit();
                                // optional chance for country "prefix"
                                if (Math.random() > 0.7) {
                                    newName = countryPrefs[Math.floor(Math.random() * countryPrefs.length)] + ' ' + newName;
                                }
                                //Now check if we already have this name
                                isUnique = this.countryNames.indexOf(newName) < 0;
                                cell.name = newName;
                            }
                            this.countryNames.push(newName);
                            console.log('Cell', newName, 'has terrain', cell.terrType)
                        }
                    }
                },
                distance: function (a, b) {
                    var dx = a.x - b.x,
                        dy = a.y - b.y;
                    return Math.sqrt(dx * dx + dy * dy);
                },

                cellArea: function (cell) {
                    var area = 0,
                        halfedges = cell.halfedges,
                        iHalfedge = halfedges.length,
                        halfedge,
                        p1, p2;
                    while (iHalfedge--) {
                        halfedge = halfedges[iHalfedge];
                        p1 = this.getStartpoint(halfedge);
                        p2 = this.getEndpoint(halfedge);
                        area += p1.x * p2.y;
                        area -= p1.y * p2.x;
                    }
                    area /= 2;
                    return area;
                },

                cellCentroid: function (cell) {
                    var x = 0,
                        y = 0,
                        halfedges = cell.halfedges,
                        iHalfedge = halfedges.length,
                        halfedge,
                        v, p1, p2;
                    while (iHalfedge--) {
                        halfedge = halfedges[iHalfedge];
                        p1 = this.getStartpoint(halfedge);
                        p2 = this.getEndpoint(halfedge);
                        v = p1.x * p2.y - p2.x * p1.y;
                        x += (p1.x + p2.x) * v;
                        y += (p1.y + p2.y) * v;
                    }
                    v = this.cellArea(cell) * 6;
                    return {
                        x: x / v,
                        y: y / v
                    };
                },

                compute: function (sites) {
                    this.sites = sites;
                    this.voronoi.recycle(this.diagram);
                    this.diagram = this.voronoi.compute(sites, this.bbox);
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        if (Math.random() > 0.7) {
                            //we're using earth-like ratios here, where 70% of earth is water
                            this.diagram.cells[i].isLand = true;
                            //determine biome:

                            /*chance for terrain to be snow-covered is based on 
                            the y-position as follows:
                             - Take percent position (y/canvas height), subtract 5. 
                             - This gives us, essentially, a max of 50% in either direction.
                             - Do Math.abs() on it, since it doesnt if we're N vs S.
                             - If this val is >.25 (about 45deg irl), chance to be frozen
                             - As we move to poles, Math.random()/.4 (max of 0.25) has a SMALLER chance of
                             being greater than our Lat. If greater, warm. Otherwise, cold.
                            */
                            var isFroze = Math.abs((this.diagram.cells[i].site.y / this.canvas.height) - .5) > .25 ? Math.abs((this.diagram.cells[i].site.y / this.canvas.height) - .5) - .25 > (Math.random() / 4) : false;
                            console.log('CELL', i, 'FROZEN?', isFroze)
                            if (isFroze) {
                                this.diagram.cells[i].terrType = biomeTypes['cold'][Math.floor(Math.random() * biomeTypes['cold'].length)];
                            } else {
                                this.diagram.cells[i].terrType = biomeTypes['warm'][Math.floor(Math.random() * biomeTypes['warm'].length)];
                            }

                        } else {
                            this.diagram.cells[i].terrType = 'water';
                            this.diagram.cells[i].isLand = false;
                        }
                    }
                },
                clearMap: function () {
                    //to blank a map if necessary
                    var ctx = this.canvas.getContext('2d');
                    // background
                    ctx.globalAlpha = 1;
                    ctx.rect(0, 0, this.canvas.width, this.canvas.height);
                    ctx.fillStyle = 'white';
                    ctx.fill();
                },
                render: function () {
                    //drawBorders
                    var ctx = this.canvas.getContext('2d'),
                        waterImg = new Image(),
                        me = this;
                    waterImg.src = '../img/water.jpg';

                    waterImg.onload = function () {
                        ctx.rect(0, 0, me.canvas.width, me.canvas.height);
                        ctx.fillStyle = ctx.createPattern(this, "repeat");
                        ctx.fill();

                        // background
                        ctx.globalAlpha = 1;
                        ctx.beginPath();
                        ctx.strokeStyle = '#888';
                        ctx.stroke();
                        // voronoi
                        if (!me.diagram) {
                            return;
                        }
                        //to get angle: 
                        ctx.lineWidth = 2;
                        var edges = me.diagram.edges,
                            iEdge = edges.length,
                            edge, v;
                        while (iEdge--) {
                            ctx.beginPath();
                            edge = edges[iEdge];
                            ctx.strokeStyle = '#003259';
                            v = edge.va;
                            ctx.moveTo(v.x, v.y);
                            v = edge.vb;
                            ctx.lineTo(v.x, v.y);
                            ctx.stroke();
                        }
                        me.doAllCells();

                    };
                },
                getCellNames: function () {
                    var ctx = this.canvas.getContext('2d');
                    for (var n = 0; n < this.diagram.cells.length; n++) {
                        var cell = this.diagram.cells[n];
                        if (cell.name && cell.isLand) {
                            console.log('creating country ', cell.name);
                            var textBoxWid = ctx.measureText(cell.name).width + 4;
                            ctx.fillStyle = '#fed';
                            ctx.fillRect(Math.floor(cell.site.x - (textBoxWid / 2) - 2), Math.floor(cell.site.y - 13), textBoxWid, 13); //country label background
                            ctx.fillStyle = '#000';
                            ctx.font = '12px Arial';
                            ctx.fillText(cell.name, cell.site.x - (textBoxWid / 2), cell.site.y - 2);
                            cell.country = cell.name;
                        }
                        cell.army = {
                            num: 0,
                            usr: null
                        };
                    }
                },
                findCell: function (x, y) {
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        if (this.diagram.cells[i].site.x == x && this.diagram.cells[i].site.y == y) {
                            return this.diagram.cells[i];
                        }
                    }
                    return false;
                },
                buildTreemap: function () {
                    var treemap = new QuadTree({
                        x: this.bbox.xl,
                        y: this.bbox.yt,
                        width: this.bbox.xr - this.bbox.xl,
                        height: this.bbox.yb - this.bbox.yt
                    });
                    var cells = this.diagram.cells,
                        iCell = cells.length;
                    while (iCell--) {
                        bbox = cells[iCell].getBbox();
                        bbox.cellid = iCell;
                        treemap.insert(bbox);
                    }
                    return treemap;
                },
                pointIntersection: function (cell, x, y) {
                    // Check if point in polygon. Since all polygons of a Voronoi
                    // diagram are convex, then:
                    // http://paulbourke.net/geometry/polygonmesh/
                    // Solution 3 (2D):
                    //   "If the polygon is convex then one can consider the polygon
                    //   "as a 'path' from the first vertex. A point is on the interior
                    //   "of this polygons if it is always on the same side of all the
                    //   "line segments making up the path. ...
                    //   "(y - y0) (x1 - x0) - (x - x0) (y1 - y0)
                    //   "if it is less than 0 then P is to the right of the line segment,
                    //   "if greater than 0 it is to the left, if equal to 0 then it lies
                    //   "on the line segment"
                    var halfedges = cell.halfedges,
                        iHalfedge = halfedges.length,
                        halfedge,
                        p0, p1, r;
                    while (iHalfedge--) {
                        halfedge = halfedges[iHalfedge];
                        p0 = this.getStartpoint(halfedge);
                        p1 = this.getEndpoint(halfedge);
                        r = (y - p0.y) * (p1.x - p0.x) - (x - p0.x) * (p1.y - p0.y);
                        if (!r) {
                            return 0;
                        }
                        if (r > 0) {
                            return -1;
                        }
                    }
                    return 1;
                },
                getStartpoint: function (h) {
                    return h.edge.lSite === h.site ? h.edge.va : h.edge.vb;
                },
                getEndpoint: function (h) {
                    return h.edge.lSite === h.site ? h.edge.vb : h.edge.va;
                },
                cellIdFromPoint: function (x, y) {
                    // We build the treemap on-demand

                    this.treemap = this.buildTreemap();
                    console.log('Treez', this.treemap);
                    // Get the Voronoi cells from the tree map given x,y
                    var items = this.treemap.retrieve({
                            x: x,
                            y: y
                        }),
                        iItem = items.length,
                        cells = this.diagram.cells,
                        cell, cellid, cellNums = this.diagram.cells.length;
                    while (iItem--) {
                        cellid = items[iItem].cellid;
                        cell = cells[cellid];
                        if (this.pointIntersection(cell, x, y) > 0) {
                            return cellid;
                        }
                    }
                    return undefined;
                },
                cellByPoint: function (x, y) {
                    var cells = this.diagram.cells,
                        cell, cellNum = this.diagram.cells.length;
                    while (--cellNum) {
                        cell = cells[cellNum];
                        if (this.pointIntersection(cell, x, y) > 0) {
                            return cellNum;
                        }
                    }
                },
                renderCell: function (id, ptrn) {
                    if (id === undefined) {
                        return;
                    }
                    if (!this.diagram) {
                        return;
                    }
                    var cell = this.diagram.cells[id];
                    if (!cell) {
                        return;
                    }
                    var ctx = this.canvas.getContext('2d');
                    console.log('RENDERING CELL', id, 'FOR CONTEXT', ctx, 'WITH PATTERN', ptrn);
                    ctx.globalAlpha = 1;
                    // edges
                    ctx.beginPath();
                    var halfedges = cell.halfedges,
                        nHalfedges = halfedges.length,
                        v = this.getStartpoint(halfedges[0]);
                    ctx.moveTo(v.x, v.y);

                    for (var iHalfedge = 0; iHalfedge < nHalfedges; iHalfedge++) {
                        v = this.getEndpoint(halfedges[iHalfedge]);
                        ctx.lineTo(v.x, v.y);
                    }
                    ctx.fillStyle = ptrn;
                    ctx.strokeStyle = '#AB9B69';
                    ctx.fill();
                    ctx.stroke();
                    // site
                    v = cell.site;
                    ctx.fillStyle = '#44f';
                    ctx.beginPath();
                    ctx.rect(v.x - 2 / 3, v.y - 2 / 3, 2, 2);
                    ctx.fill();
                },
                doAllCells: function () {
                    var landTypes = biomeTypes['warm'].concat(biomeTypes['cold']),
                        landImgProms = [],
                        imgArr = [],
                        me = this,
                        ctx = this.canvas.getContext("2d");
                    var imsDone = 0;
                    for (var i = 0; i < landTypes.length; i++) {
                        imgArr[i] = new Image();
                        imgArr[i].src = '../img/terrains/' + landTypes[i].replace(/\s/, '_') + '.jpg';
                        imgArr[i].onload = function () {
                            var thePtrn = ctx.createPattern(this, "repeat"),
                                thisTerr = this.src.slice(this.src.lastIndexOf('/') + 1, this.src.lastIndexOf('.')).replace('_', ' ') || 'plains';
                            for (var n = 0; n < me.diagram.cells.length; n++) {
                                // console.log(thePtrn, me.diagram.cells[n].terrType, thisTerr)
                                if (me.diagram.cells[n].isLand && me.diagram.cells[n].terrType == thisTerr) {
                                    me.renderCell(n, thePtrn);
                                }
                            }
                            imsDone++;
                            console.log('IMAGES DONE:', imsDone, 'of', landTypes.length)
                            if (imsDone == landTypes.length) {
                                me.makeCellNames();
                                me.getCellNames();
                                me.doCellSites();
                            }
                        }
                    }
                },
                getCellByName: function (n) {
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        if (this.diagram.cells[i].name == n) return this.diagram.cells[i];
                    }
                    return false;
                },
                getCellNumByName: function (n) {
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        if (this.diagram.cells[i].name == n) return i;
                    }
                    return false;
                },
                getContinents: function () {
                    doneCouns = [];
                    allConts = [];
                    justCouns = this.diagram.cells.filter((cf) => {
                        return !!cf.name;
                    });
                    console.log('num countries', justCouns.length)
                    for (var i = 0; i < justCouns.length; i++) {
                        if (justCouns[i].name && doneCouns.indexOf(justCouns[i].name) < 0) {
                            //this cell is a country, and has not already been recorded so run the findNeighbors fn on it, then push the results into our list of continents
                            this.findNeighbors(i, true);
                            allConts.push(currCont);
                        }
                    }
                    console.log('Countries:', doneCouns)
                    var allContsNoDups = [];
                    allConts.forEach((cont) => {
                        var reptCounts = [];
                        cont.forEach((x) => {
                            if (reptCounts.indexOf(x) < 0) {
                                reptCounts.push(x);
                            }
                        });
                        allContsNoDups.push(reptCounts);
                    })
                    return allContsNoDups; //should be ok? eep.
                },
                findNeighbors: function (n, m) {
                    if (m) {
                        //root node
                        currCont = [];
                    }
                    m = false; //in case we're running recursively for found neighbors.
                    currCont.push(justCouns[n].name)
                    console.log('pushing', justCouns[n].name, 'into array!')
                    doneCouns.push(justCouns[n].name);
                    var kids = [];
                    for (var i = 0; i < justCouns.length; i++) {
                        if (justCouns[i].name && i != n && doneCouns.indexOf(justCouns[i].name) < 0) {
                            //valid cell to check
                            var sx = justCouns[n].site.x,
                                sy = justCouns[n].site.y;
                            for (var e = 0; e < justCouns[n].halfedges.length; e++) {
                                //cycle thru all edges and check if neighbor
                                //find start and end
                                if (!justCouns[n].halfedges[e].edge.rSite || !justCouns[n].halfedges[e].edge.lSite) {
                                    //incomplete edge: missing either left or right 'sides' so we cannot test this.
                                    continue;
                                }
                                if (justCouns[n].halfedges[e].edge.rSite.x == sx && justCouns[n].halfedges[e].edge.rSite.y == sy) {
                                    //rSite is origin (source cell)
                                    // console.log('rSite origin')
                                    if (justCouns[n].halfedges[e].edge.lSite.x == justCouns[i].site.x && justCouns[n].halfedges[e].edge.lSite.y == justCouns[i].site.y) {
                                        console.log(justCouns[i].name, 'is a neighbor of', justCouns[n].name)
                                        kids.push(i);
                                    }
                                } else {
                                    // console.log('lSite origin')
                                    //lSite is origin (source cell)
                                    if (justCouns[n].halfedges[e].edge.rSite.x == justCouns[i].site.x && justCouns[n].halfedges[e].edge.rSite.y == justCouns[i].site.y) {
                                        console.log(justCouns[i].name, 'is a neighbor of', justCouns[n].name)
                                        kids.push(i);
                                    }
                                }
                            }
                        }
                    }
                    kids.forEach((c) => {
                        this.findNeighbors(c);
                    })

                },
                findNeighborsOld: function (c, mode) {
                    //OLD VERSION
                    if (mode) {
                        if (currCont && currCont.length) allConts.push(currCont);
                        currCont = [];
                    }
                    var names = [this.diagram.cells[c].name];
                    console.log('for cell', c, 'names starts as', names);
                    if (!this.diagram.cells[c].name) {
                        return;
                    }
                    if (this.indexOf(this.diagram.cells[c].name) > -1) {
                        console.log('cell', this.diagram.cells[c].name, 'already doneCouns');
                        return names;
                    }
                    this.push(this.diagram.cells[c].name);
                    currCont.push(this.diagram.cells[c].name);
                    // for any cell with id c, find the neighbors. For each neighbor, find THAT cell's neighbors. If said neighbor is already in this.doneCouns, ignore
                    //first, short-circuit if cell is already recorded;
                    var kids = [];
                    for (var i = 0; i < this.diagram.cells[c].halfedges.length; i++) {
                        if (!this.diagram.cells[c].halfedges[i].edge.rSite || !this.diagram.cells[c].halfedges[i].edge.lSite) {
                            //either left or right side is not defined. Cannot parse
                            continue;
                        }
                        var neighborNum = this.cellByPoint(this.diagram.cells[c].halfedges[i].edge.rSite.x, this.diagram.cells[c].halfedges[i].edge.rSite.y);
                        if (this.diagram.cells[neighborNum] && this.diagram.cells[c].name == this.diagram.cells[neighborNum].name) {
                            //switch neighbor dir
                            neighborNum = this.cellByPoint(this.diagram.cells[c].halfedges[i].edge.lSite.x, this.diagram.cells[c].halfedges[i].edge.lSite.y);
                        }
                        if (typeof neighborNum == 'undefined' || !this.diagram.cells[neighborNum]) {
                            //for whatever reason, neighborNum is invalid
                            continue;
                        }
                        if (this.diagram.cells[neighborNum].name && this.doneCouns.indexOf(this.diagram.cells[neighborNum].name) == -1) {
                            kids.push(neighborNum);
                        }
                    }
                    if (kids.length) {
                        console.log('cell', c, 'has neighbors ("kids")', kids);
                    } else {
                        console.log('cell', c, 'has NO kids');
                    }
                    var me = this;
                    kids.forEach(function (k) {
                        var naybz = me.findNeighbors(k);
                        naybz.forEach(function (n) {
                            if (me.doneCouns.indexOf(n) == -1) {
                                names.push(n);
                            }
                        });
                    });
                    return names;
                },
                findNaybz: function (c, m) {
                    return findNeighbors(c, m);
                }
            };
            return newVor;
        }
    };
});