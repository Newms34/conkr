app.factory('mapFact', function($rootScope) {
    var smoothAmt = 100,
        countries = {
            names: ['Nasteaburg', 'Dutralor', 'Eslos', 'Oglyae', 'Cruiria', 'Whuadal', 'Ethua', 'Estaria', 'Shiod', 'Skesh', 'Froe', 'Glen', 'Yacluoria', 'Desmayyae', 'Oskana', 'Echea', 'Pleiles', 'Ploussau', 'Usnea', 'Oprijan', 'Fleol', 'Spijan', 'Flie Stril', 'Iecheidal', 'Beplayburg', 'Raprana', 'Qescyae', 'Smeuqua', 'Tresil', 'Ospary', 'Eflary', 'Bloek', 'Pral', 'Cluyx Smea', 'Cegriydal', 'Ethoeque', 'Pacril', 'Justril', 'Stoynga', 'Swuyque', 'Osnyae', 'Estron', 'Flauh', 'Clyae', 'Theul Plar', 'Osmoirus', 'Osliuji', 'Qetrington', 'Cuflus', 'Brioca', 'Skuocia', 'Ashad', 'Ecrar', 'Snoyg','Drington', 'Cresh', 'Cutraynia', 'Qechiavania', 'Pechary', 'Jadrar', 'Striurus', 'Smoiburg', 'Aspil', 'Ascington', 'Thain', 'Brex','Prax', 'Gusmaonga', 'Jestruibia', 'Woscyae', 'Vascea', 'Dreyssau', 'Flecia', 'Aglos', 'Estyae', 'Shiyk', 'Thesh', 'Glaeq', 'Slea', 'Fasmiulia', 'Pagluorhiel', 'Wachil', 'Wegrya', 'Snobar', 'Smeobar', 'Athana', 'Ogresh', 'Smait', 'Whus', 'Zusleuland', 'Ofleilor', 'Beflington', 'Cusmyae', 'Swobia', 'Thiostan', 'Uclain', 'Adryae', 'Frio', 'Spington', 'Gloir', 'Star', 'Fustredor', 'Pucrourhiel', 'Quplana', 'Tasnye', 'Spoubia', 'Griycia', 'Uchos', 'Achyae', 'Gruoz', 'Smijan', 'Swiur', 'Crary'],
            prefs: ['East', 'West', 'North', 'South', 'Republic of', 'Kingdom of', 'Empire of']
        };

    return {
        GetVoronoi: function(hi, wid, numCells, schmooz) {
            var newVor = {
                voronoi: new Voronoi(),
                diagram: null,
                margin: 0.1,
                canvas: null,
                bbox: { xl: 0, xr: wid, yt: 0, yb: hi },
                sites: [],
                countryNames: [],
                timeoutDelay: 30,
                numsRelaxed: 100,

                init: function() {
                    this.canvas = document.querySelector('canvas');
                    this.randomSites(numCells, true);
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
                        this.doAllCells();
                        this.render();
                        this.getCellNames();
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

                render: function() {
                    var ctx = this.canvas.getContext('2d');
                    // background
                    ctx.globalAlpha = 1;
                    ctx.beginPath();
                    // ctx.rect(0, 0, this.canvas.width, this.canvas.height);
                    // ctx.fillStyle = 'white';
                    // ctx.fill();
                    ctx.strokeStyle = '#888';
                    ctx.stroke();
                    // voronoi
                    if (!this.diagram) {
                        return;
                    }
                    //to get angle: 



                    ctx.lineWidth = 5;
                    var edges = this.diagram.edges,
                        iEdge = edges.length,
                        edge, v;
                    var gradArr = [];
                    while (iEdge--) {
                        ctx.beginPath();
                        edge = edges[iEdge];
                        var edgeGradLine = this.getEdgeGrad(edge);
                        console.log(edgeGradLine);
                        gradArr.push(ctx.createLinearGradient(edgeGradLine.xi, edgeGradLine.yi, edgeGradLine.xf, edgeGradLine.yf));
                        gradArr[gradArr.length - 1].addColorStop(0, edgeGradLine.start);
                        gradArr[gradArr.length - 1].addColorStop(1, edgeGradLine.end);
                        ctx.strokeStyle = gradArr[gradArr.length - 1];
                        v = edge.va;
                        ctx.moveTo(v.x, v.y);
                        v = edge.vb;
                        ctx.lineTo(v.x, v.y);
                        ctx.stroke();
                    }

                    // sites
                    ctx.beginPath();
                    ctx.fillStyle = '#44f';
                    var sites = this.sites,
                        iSite = sites.length;
                    while (iSite--) {
                        v = sites[iSite];
                        ctx.rect(v.x - 2 / 3, v.y - 2 / 3, 2, 2);
                    }
                    ctx.fill();
                },
                getEdgeGrad: function(e) {
                    console.log('EDGEGRAD', e);
                    if (!e.lSite || !e.rSite) {
                        return {
                            xi: 0,
                            xf: 100,
                            yi: 0,
                            yf: 0,
                            start: '#0c0',
                            end: '#000'
                        };
                    }
                    var grad = {
                            xi: null,
                            xf: null,
                            yi: null,
                            yf: null,
                            start: '#35a',
                            end: '#35a'
                        },
                        // source = this.diagram.cells[this.cellIdFromPoint(e.lSite.x, e.lSite.y)],
                        // dest = this.diagram.cells[this.cellIdFromPoint(e.rSite.x, e.rSite.y)],
                        source = this.findCell(e.lSite.x, e.lSite.y),
                        dest = this.findCell(e.rSite.x, e.rSite.y),
                        ang = Math.atan((e.rSite.y - e.lSite.y) / (e.rSite.x - e.lSite.x)) + (0 * Math.PI / 2),
                        midPt = { x: (e.rSite.x + e.lSite.x) / 2, y: (e.rSite.y - e.lSite.y) },
                        dh = 5 * Math.sin(ang),
                        dw = 5 * Math.cos(ang);
                    if (ang > Math.PI) {
                        ang = Math.PI - ang;
                    }
                    console.log('SOURCE', source, 'DEST', dest, 'src', this.cellIdFromPoint(e.lSite.x, e.lSite.y), 'd', this.cellIdFromPoint(e.rSite.x, e.rSite.y), 'full input', e);
                    grad.xi = midPt.x - dw;
                    grad.xf = midPt.x + dw;
                    grad.yi = midPt.y - dh;
                    grad.yf = midPt.y + dh;
                    if (source.isLand) {
                        grad.start = '#9c9';
                    }
                    if (dest.isLand) {
                        grad.end = '#9c9';
                    }
                    return grad;
                },
                getCellNames: function() {
                    var ctx = this.canvas.getContext('2d');
                    for (var n = 0; n < this.diagram.cells.length; n++) {
                        var cell = this.diagram.cells[n];
                        var newName = null;
                        if (cell.isLand) {
                            var isUnique = false; //default this to false, set to true if our name we generate is indeed unique
                            while (!isUnique) {
                                newName = countries.names[Math.floor(Math.random() * countries.names.length)];
                                if (Math.random() > 0.7) {
                                    newName = countries.prefs[Math.floor(Math.random() * countries.prefs.length)] + ' ' + newName;
                                }
                                //Now check if we already have this name
                                isUnique = this.countryNames.indexOf(newName) < 0;
                            }
                            this.countryNames.push(newName);
                            console.log('creating country ',newName)
                            var textBoxWid = ctx.measureText(newName).width+4;
                            ctx.fillStyle = '#fed';
                            console.log('CELL LABEL DIMS FOR CELL',n,':',Math.floor(cell.site.x-(textBoxWid / 2)-2),Math.floor(cell.site.y-13),textBoxWid,13,' NAME WID:',textBoxWid)
                            ctx.fillRect(Math.floor(cell.site.x-(textBoxWid / 2)-2),Math.floor(cell.site.y-13),textBoxWid,13);//country label background
                            ctx.fillStyle = '#000'
                            ctx.font = '10px Arial';
                            ctx.fillText(newName, cell.site.x - (textBoxWid / 2), cell.site.y-2)
                            cell.country = newName;
                        }
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
                        cell, cellid;
                    while (iItem--) {
                        cellid = items[iItem].cellid;
                        cell = cells[cellid];
                        if (cell.pointIntersection(x, y) > 0) {
                            return cellid;
                        }
                    }
                    return undefined;
                },

                renderCell: function(id, fillStyle, strokeStyle) {
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
                    ctx.fillStyle = fillStyle;
                    ctx.strokeStyle = strokeStyle;
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
                    for (var n = 0; n < this.diagram.cells.length; n++) {
                        var col = '#000',
                            eCol = '#fff',
                            doName = false;
                        if (this.diagram.cells[n].isLand) {
                            //cell is land, so give name, color green
                            col = '#0c0';
                            eCol = '#9c9';
                        } else {
                            //water
                            col = '#35a';
                            eCol = '#92a8c8';
                        }
                        this.renderCell(n, col, eCol)
                    }
                }
            };
            return newVor;
        }
    };
});
