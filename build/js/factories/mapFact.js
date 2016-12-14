app.factory('mapFact', function($rootScope, $http) {
    var smoothAmt = 100,
        countries = {
            names: ['Nasteaburg', 'Dutralor', 'Eslos', 'Oglyae', 'Cruiria', 'Whuadal', 'Ethua', 'Estaria', 'Shiod', 'Skesh', 'Froe', 'Glen', 'Yacluoria', 'Desmayyae', 'Oskana', 'Echea', 'Pleiles', 'Ploussau', 'Usnea', 'Oprijan', 'Fleol', 'Spijan', 'Flie Stril', 'Iecheidal', 'Beplayburg', 'Raprana', 'Qescyae', 'Smeuqua', 'Tresil', 'Ospary', 'Eflary', 'Bloek', 'Pral', 'Cluyx Smea', 'Cegriydal', 'Ethoeque', 'Pacril', 'Justril', 'Stoynga', 'Swuyque', 'Osnyae', 'Estron', 'Flauh', 'Clyae', 'Theul Plar', 'Osmoirus', 'Osliuji', 'Qetrington', 'Cuflus', 'Brioca', 'Skuocia', 'Ashad', 'Ecrar', 'Snoyg', 'Drington', 'Cresh', 'Cutraynia', 'Qechiavania', 'Pechary', 'Jadrar', 'Striurus', 'Smoiburg', 'Aspil', 'Ascington', 'Thain', 'Brex', 'Prax', 'Gusmaonga', 'Jestruibia', 'Woscyae', 'Vascea', 'Dreyssau', 'Flecia', 'Aglos', 'Estyae', 'Shiyk', 'Thesh', 'Glaeq', 'Slea', 'Fasmiulia', 'Pagluorhiel', 'Wachil', 'Wegrya', 'Snobar', 'Smeobar', 'Athana', 'Ogresh', 'Smait', 'Whus', 'Zusleuland', 'Ofleilor', 'Beflington', 'Cusmyae', 'Swobia', 'Thiostan', 'Uclain', 'Adryae', 'Frio', 'Spington', 'Gloir', 'Star', 'Fustredor', 'Pucrourhiel', 'Quplana', 'Tasnye', 'Spoubia', 'Griycia', 'Uchos', 'Achyae', 'Gruoz', 'Smijan', 'Swiur', 'Crary'],
            prefs: ['East', 'West', 'North', 'South', 'Republic of', 'Kingdom of', 'Empire of']
        };

    return {
        loadMaps: function() {
            // load all maps so we can pick one.
            return $http.get('/map/loadMaps').then(function(r) {
                return r;
            });
        },
        loadOneMap: function(id) {
            console.log('attempting to get map', id)
            return $http.get('/map/loadMap/' + id).then(function(r) {
                return r;
            });
        },
        isNeighbor: function(c, s, d) {
            //c: cells (array), s: start cell, d: destination cell
            if (!c[s] || !c[d]) {
                throw new Error('cells not found!')
                return;
            }
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
        GetVoronoi: function(hi, wid, numCells, schmooz) {
            var newVor = {
                voronoi: new Voronoi(),
                diagram: null,
                margin: 0.1,
                canvas: null,
                bbox: { xl: 0, xr: wid, yt: 0, yb: hi },
                sites: [],
                countryNames: [],
                cellCenters: [],
                timeoutDelay: 30,
                numsRelaxed: 100,
                init: function() {
                    this.canvas = document.querySelector('canvas');
                    this.clearMap();
                    this.randomSites(numCells, true);
                },
                save: function() {
                    // note: this function is for saving a map. it is NOT for saving a game!
                    var mapData = {
                        countryNames: this.countryNames,
                        bbox: this.bbox,
                        sites: this.sites,
                        numsRelaxed: this.numsRelaxed,
                        diagram: this.diagram,
                        doneCouns: this.doneCouns,
                        currCont: this.currCont,
                        cellCenters: this.cellCenters,
                        img: this.canvas.toDataURL()
                    };
                    console.log('TO SAVE:', mapData);
                    return $http.post('/map/newMap', mapData).then(function(r) {
                        return r;
                    });
                },
                clearSites: function() {
                    this.compute([]);
                },

                randomSites: function(n, clear) {
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
                        sites.push({ x: self.Math.round((xo + self.Math.random() * dx) * 10) / 10, y: self.Math.round((yo + self.Math.random() * dy) * 10) / 10 });
                    }
                    this.compute(sites);
                    // relax sites
                    if (this.timeout) {
                        clearTimeout(this.timeout);
                        this.timeout = null;
                    }
                    var me = this;
                    this.timeout = setTimeout(function() {
                        me.relaxSites();
                    }, this.timeoutDelay);
                },

                relaxSites: function() {
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
                        // probability of mytosis
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
                        this.timeout = setTimeout(function() {
                            me.relaxSites();
                        }, this.timeoutDelay);
                    } else {
                        this.render();

                    }
                },
                doCellSites: function() {
                    this.diagram.cells.forEach((c) => {
                        if (c.name || c.country) {
                            this.cellCenters.push({
                                x: c.site.x,
                                y: c.site.y,
                                name: c.name || c.country
                            });
                        }
                    });
                },
                initLoad: function(im) {
                    //simply redraw an old map on canvas.
                    this.canvas = document.querySelector('canvas');
                    this.clearMap();
                    this.getCellNames();
                    var ctx = this.canvas.getContext('2d'),
                        img = new Image(),
                        canv = this.canvas;
                    img.onload = function() {
                        canv.width = img.width;
                        canv.height = img.height;
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = im;
                },
                makeCellNames: function() {
                    for (var n = 0; n < this.diagram.cells.length; n++) {
                        var cell = this.diagram.cells[n];
                        var newName = null;
                        if (cell.isLand) {
                            var isUnique = false;
                            while (!isUnique) {
                                newName = countries.names[Math.floor(Math.random() * countries.names.length)];
                                // optional chance for country "prefix"
                                if (Math.random() > 0.7) {
                                    newName = countries.prefs[Math.floor(Math.random() * countries.prefs.length)] + ' ' + newName;
                                }
                                //Now check if we already have this name
                                isUnique = this.countryNames.indexOf(newName) < 0;
                                cell.name = newName;
                            }
                            this.countryNames.push(newName);
                        }
                    }
                },
                distance: function(a, b) {
                    var dx = a.x - b.x,
                        dy = a.y - b.y;
                    return Math.sqrt(dx * dx + dy * dy);
                },

                cellArea: function(cell) {
                    var area = 0,
                        halfedges = cell.halfedges,
                        iHalfedge = halfedges.length,
                        halfedge,
                        p1, p2;
                    while (iHalfedge--) {
                        halfedge = halfedges[iHalfedge];
                        p1 = halfedge.getStartpoint();
                        p2 = halfedge.getEndpoint();
                        area += p1.x * p2.y;
                        area -= p1.y * p2.x;
                    }
                    area /= 2;
                    return area;
                },

                cellCentroid: function(cell) {
                    var x = 0,
                        y = 0,
                        halfedges = cell.halfedges,
                        iHalfedge = halfedges.length,
                        halfedge,
                        v, p1, p2;
                    while (iHalfedge--) {
                        halfedge = halfedges[iHalfedge];
                        p1 = halfedge.getStartpoint();
                        p2 = halfedge.getEndpoint();
                        v = p1.x * p2.y - p2.x * p1.y;
                        x += (p1.x + p2.x) * v;
                        y += (p1.y + p2.y) * v;
                    }
                    v = this.cellArea(cell) * 6;
                    return { x: x / v, y: y / v };
                },

                compute: function(sites) {
                    this.sites = sites;
                    this.voronoi.recycle(this.diagram);
                    this.diagram = this.voronoi.compute(sites, this.bbox);
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        if (Math.random() > 0.7) {
                            this.diagram.cells[i].isLand = true;
                            console.log('cell', i, 'is land');
                        } else {
                            this.diagram.cells[i].isLand = false;
                        }
                    }
                },
                clearMap: function() {
                    //to blank a map if necessary
                    var ctx = this.canvas.getContext('2d');
                    // background
                    ctx.globalAlpha = 1;
                    ctx.rect(0, 0, this.canvas.width, this.canvas.height);
                    ctx.fillStyle = 'white';
                    ctx.fill();
                },
                render: function() {
                    //drawBorders
                    var ctx = this.canvas.getContext('2d'),
                        waterImg = new Image(),
                        me = this;
                    waterImg.src = '../img/water.jpg';

                    waterImg.onload = function() {
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
                            // var edgeGradLine = me.getEdgeGrad(edge);
                            // console.log(edgeGradLine);
                            // // gradArr.push(ctx.createLinearGradient(edgeGradLine.xi, edgeGradLine.yi, edgeGradLine.xf, edgeGradLine.yf));
                            // // gradArr[gradArr.length - 1].addColorStop(0, edgeGradLine.start);
                            // // gradArr[gradArr.length - 1].addColorStop(1, edgeGradLine.end);
                            // ctx.strokeStyle = gradArr[gradArr.length - 1];
                            ctx.strokeStyle = '#003259'
                            v = edge.va;
                            ctx.moveTo(v.x, v.y);
                            v = edge.vb;
                            ctx.lineTo(v.x, v.y);
                            ctx.stroke();
                        }
                        me.doAllCells();
                        
                    };
                },
                getCellNames: function() {
                    var ctx = this.canvas.getContext('2d');
                    for (var n = 0; n < this.diagram.cells.length; n++) {
                        var cell = this.diagram.cells[n];
                        if (cell.name && cell.isLand) {
                            console.log('creating country ', cell.name);
                            var textBoxWid = ctx.measureText(cell.name).width + 4;
                            ctx.fillStyle = '#fed';
                            console.log('CELL LABEL DIMS FOR CELL', n, ':', Math.floor(cell.site.x - (textBoxWid / 2) - 2), Math.floor(cell.site.y - 13), textBoxWid, 13, ' NAME WID:', textBoxWid);
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
                findCell: function(x, y) {
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        if (this.diagram.cells[i].site.x == x && this.diagram.cells[i].site.y == y) {
                            return this.diagram.cells[i];
                        }
                    }
                    return false;
                },
                buildTreemap: function() {
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
                cellIdFromPoint: function(x, y) {
                    // We build the treemap on-demand

                    this.treemap = this.buildTreemap();
                    console.log('Treez', this.treemap);
                    // Get the Voronoi cells from the tree map given x,y
                    var items = this.treemap.retrieve({ x: x, y: y }),
                        iItem = items.length,
                        cells = this.diagram.cells,
                        cell, cellid, cellNums = this.diagram.cells.length;
                    while (iItem--) {
                        cellid = items[iItem].cellid;
                        cell = cells[cellid];
                        if (cell.pointIntersection(x, y) > 0) {
                            return cellid;
                        }
                    }
                    return undefined;
                },
                cellByPoint: function(x, y) {
                    var cells = this.diagram.cells,
                        cell, cellNum = this.diagram.cells.length;
                    while (--cellNum) {
                        cell = cells[cellNum];
                        if (cell.pointIntersection(x, y) > 0) {
                            return cellNum;
                        }
                    }
                },
                renderCell: function(id) {
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
                    console.log('RENDERING CELL', id, 'FOR CONTEXT', ctx)
                    ctx.globalAlpha = 1;
                    // edges
                    ctx.beginPath();
                    var halfedges = cell.halfedges,
                        nHalfedges = halfedges.length,
                        v = halfedges[0].getStartpoint();
                    ctx.moveTo(v.x, v.y);

                    for (var iHalfedge = 0; iHalfedge < nHalfedges; iHalfedge++) {
                        v = halfedges[iHalfedge].getEndpoint();
                        ctx.lineTo(v.x, v.y);
                    }
                    // ctx.fillStyle = '#0c0';
                    // ctx.strokeStyle = '#9c9';
                    ctx.fillStyle = this.landPattern;
                    ctx.strokeStyle = '#AB9B69'
                    ctx.fill();
                    ctx.stroke();
                    // site
                    v = cell.site;
                    ctx.fillStyle = '#44f';
                    ctx.beginPath();
                    ctx.rect(v.x - 2 / 3, v.y - 2 / 3, 2, 2);
                    ctx.fill();
                },
                doAllCells: function() {
                    var landImg = new Image(),
                        me = this,
                        ctx = this.canvas.getContext("2d");
                        landImg.src = '../img/grass.jpg'
                    landImg.onload = function() {
                        me.landPattern = ctx.createPattern(this, "repeat");
                        for (var n = 0; n < me.diagram.cells.length; n++) {
                            if (me.diagram.cells[n].isLand) me.renderCell(n);
                        }
                        me.makeCellNames();
                        me.getCellNames();
                        me.doCellSites();
                    }
                },
                getCellByName: function(n) {
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        if (this.diagram.cells[i].name == n) return this.diagram.cells[i];
                    }
                    return false;
                },
                getContinents: function() {
                    this.doneCouns = [];
                    this.allConts = [];
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        this.findNeighbors(i, true);
                    }
                    return this.allConts;
                },
                doneCouns: [], //if a country's in here, don't re-add it.
                currCont: [],
                allConts: [],
                findNeighbors: function(c, mode) {
                    if (mode) {
                        if (this.currCont && this.currCont.length) this.allConts.push(this.currCont);
                        this.currCont = [];
                    }
                    m = false;
                    var names = [this.diagram.cells[c].name];
                    console.log('for cell', c, 'names starts as', names);
                    if (!this.diagram.cells[c].name) {
                        return;
                    }
                    if (this.doneCouns.indexOf(this.diagram.cells[c].name) > -1) {
                        console.log('cell', this.diagram.cells[c].name, 'already recorded.', this.doneCouns);
                        return names;
                    }
                    this.doneCouns.push(this.diagram.cells[c].name);
                    this.currCont.push(this.diagram.cells[c].name);
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
                    kids.forEach(function(k) {
                        var naybz = me.findNeighbors(k);
                        naybz.forEach(function(n) {
                            if (me.doneCouns.indexOf(n) == -1) {
                                names.push(n);
                            }
                        });
                    });
                    return names;
                },
                findNaybz: function(c, m) {
                    return findNeighbors(c, m);
                }
            };
            return newVor;
        }
    };
});
