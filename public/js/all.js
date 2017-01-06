/*jslint vars: true, nomen: true, plusplus: true, continue:true, forin:true */
/*global Node, BoundsNode */

/*
	The MIT License

	Copyright (c) 2011 Mike Chambers

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/


/**
* A QuadTree implementation in JavaScript, a 2d spatial subdivision algorithm.
* @module QuadTree
**/

(function (window) {
    "use strict";

    /****************** QuadTree ****************/

    /**
    * QuadTree data structure.
    * @class QuadTree
    * @constructor
    * @param {Object} An object representing the bounds of the top level of the QuadTree. The object 
    * should contain the following properties : x, y, width, height
    * @param {Boolean} pointQuad Whether the QuadTree will contain points (true), or items with bounds 
    * (width / height)(false). Default value is false.
    * @param {Number} maxDepth The maximum number of levels that the quadtree will create. Default is 4.
    * @param {Number} maxChildren The maximum number of children that a node can contain before it is split into sub-nodes.
    **/
    function QuadTree(bounds, pointQuad, maxDepth, maxChildren) {
        var node;
        if (pointQuad) {

            node = new Node(bounds, 0, maxDepth, maxChildren);
        } else {
            node = new BoundsNode(bounds, 0, maxDepth, maxChildren);
        }

        this.root = node;
    }

    /**
    * The root node of the QuadTree which covers the entire area being segmented.
    * @property root
    * @type Node
    **/
    QuadTree.prototype.root = null;


    /**
    * Inserts an item into the QuadTree.
    * @method insert
    * @param {Object|Array} item The item or Array of items to be inserted into the QuadTree. The item should expose x, y 
    * properties that represents its position in 2D space.
    **/
    QuadTree.prototype.insert = function (item) {
        if (item instanceof Array) {
            var len = item.length;

            var i;
            for (i = 0; i < len; i++) {
                this.root.insert(item[i]);
            }
        } else {
            this.root.insert(item);
        }
    };

    /**
    * Clears all nodes and children from the QuadTree
    * @method clear
    **/
    QuadTree.prototype.clear = function () {
        this.root.clear();
    };

    /**
    * Retrieves all items / points in the same node as the specified item / point. If the specified item
    * overlaps the bounds of a node, then all children in both nodes will be returned.
    * @method retrieve
    * @param {Object} item An object representing a 2D coordinate point (with x, y properties), or a shape
    * with dimensions (x, y, width, height) properties.
    **/
    QuadTree.prototype.retrieve = function (item) {
        //get a copy of the array of items
        var out = this.root.retrieve(item).slice(0);
        return out;
    };

    /************** Node ********************/


    function Node(bounds, depth, maxDepth, maxChildren) {
        this._bounds = bounds;
        this.children = [];
        this.nodes = [];

        if (maxChildren) {
            this._maxChildren = maxChildren;
        }

        if (maxDepth) {
            this._maxDepth = maxDepth;
        }

        if (depth) {
            this._depth = depth;
        }
    }

    //subnodes
    Node.prototype.nodes = null;
    Node.prototype._classConstructor = Node;

    //children contained directly in the node
    Node.prototype.children = null;
    Node.prototype._bounds = null;

    //read only
    Node.prototype._depth = 0;

    Node.prototype._maxChildren = 4;
    Node.prototype._maxDepth = 4;

    Node.TOP_LEFT = 0;
    Node.TOP_RIGHT = 1;
    Node.BOTTOM_LEFT = 2;
    Node.BOTTOM_RIGHT = 3;


    Node.prototype.insert = function (item) {
        if (this.nodes.length) {
            var index = this._findIndex(item);

            this.nodes[index].insert(item);

            return;
        }

        this.children.push(item);

        var len = this.children.length;
        if (!(this._depth >= this._maxDepth) &&
                len > this._maxChildren) {
            
            this.subdivide();

            var i;
            for (i = 0; i < len; i++) {
                this.insert(this.children[i]);
            }

            this.children.length = 0;
        }
    };

    Node.prototype.retrieve = function (item) {
        if (this.nodes.length) {
            var index = this._findIndex(item);

            return this.nodes[index].retrieve(item);
        }

        return this.children;
    };

    Node.prototype._findIndex = function (item) {
        var b = this._bounds;
        var left = (item.x > b.x + b.width / 2) ? false : true;
        var top = (item.y > b.y + b.height / 2) ? false : true;

        //top left
        var index = Node.TOP_LEFT;
        if (left) {
            //left side
            if (!top) {
                //bottom left
                index = Node.BOTTOM_LEFT;
            }
        } else {
            //right side
            if (top) {
                //top right
                index = Node.TOP_RIGHT;
            } else {
                //bottom right
                index = Node.BOTTOM_RIGHT;
            }
        }

        return index;
    };


    Node.prototype.subdivide = function () {
        var depth = this._depth + 1;

        var bx = this._bounds.x;
        var by = this._bounds.y;

        //floor the values
        var b_w_h = (this._bounds.width / 2); //todo: Math.floor?
        var b_h_h = (this._bounds.height / 2);
        var bx_b_w_h = bx + b_w_h;
        var by_b_h_h = by + b_h_h;

        //top left
        this.nodes[Node.TOP_LEFT] = new this._classConstructor({
            x: bx,
            y: by,
            width: b_w_h,
            height: b_h_h
        },
            depth, this._maxDepth, this._maxChildren);

        //top right
        this.nodes[Node.TOP_RIGHT] = new this._classConstructor({
            x: bx_b_w_h,
            y: by,
            width: b_w_h,
            height: b_h_h
        },
            depth, this._maxDepth, this._maxChildren);

        //bottom left
        this.nodes[Node.BOTTOM_LEFT] = new this._classConstructor({
            x: bx,
            y: by_b_h_h,
            width: b_w_h,
            height: b_h_h
        },
            depth, this._maxDepth, this._maxChildren);


        //bottom right
        this.nodes[Node.BOTTOM_RIGHT] = new this._classConstructor({
            x: bx_b_w_h,
            y: by_b_h_h,
            width: b_w_h,
            height: b_h_h
        },
            depth, this._maxDepth, this._maxChildren);
    };

    Node.prototype.clear = function () {
        this.children.length = 0;

        var len = this.nodes.length;
        
        var i;
        for (i = 0; i < len; i++) {
            this.nodes[i].clear();
        }

        this.nodes.length = 0;
    };
    

    /******************** BoundsQuadTree ****************/

    function BoundsNode(bounds, depth, maxChildren, maxDepth) {
        Node.call(this, bounds, depth, maxChildren, maxDepth);
        this._stuckChildren = [];
    }

    BoundsNode.prototype = new Node();
    BoundsNode.prototype._classConstructor = BoundsNode;
    BoundsNode.prototype._stuckChildren = null;

    //we use this to collect and conctenate items being retrieved. This way
    //we dont have to continuously create new Array instances.
    //Note, when returned from QuadTree.retrieve, we then copy the array
    BoundsNode.prototype._out = [];

    BoundsNode.prototype.insert = function (item) {
        if (this.nodes.length) {
            var index = this._findIndex(item);
            var node = this.nodes[index];

            //todo: make _bounds bounds
            if (item.x >= node._bounds.x &&
                    item.x + item.width <= node._bounds.x + node._bounds.width &&
                    item.y >= node._bounds.y &&
                    item.y + item.height <= node._bounds.y + node._bounds.height) {
                
                this.nodes[index].insert(item);
                
            } else {
                this._stuckChildren.push(item);
            }

            return;
        }

        this.children.push(item);

        var len = this.children.length;

        if (!(this._depth >= this._maxDepth) &&
                len > this._maxChildren) {
            
            this.subdivide();

            var i;
            for (i = 0; i < len; i++) {
                this.insert(this.children[i]);
            }

            this.children.length = 0;
        }
    };

    BoundsNode.prototype.getChildren = function () {
        return this.children.concat(this._stuckChildren);
    };

    BoundsNode.prototype.retrieve = function (item) {
        var out = this._out;
        out.length = 0;
        if (this.nodes.length) {
            var index = this._findIndex(item);
            var node = this.nodes[index];

            if (item.x >= node._bounds.x &&
                    item.x + item.width <= node._bounds.x + node._bounds.width &&
                    item.y >= node._bounds.y &&
                    item.y + item.height <= node._bounds.y + node._bounds.height) {
                
                out.push.apply(out, this.nodes[index].retrieve(item));
            } else {
                //Part of the item are overlapping multiple child nodes. For each of the overlapping nodes, return all containing objects.

                if (item.x <= this.nodes[Node.TOP_RIGHT]._bounds.x) {
                    if (item.y <= this.nodes[Node.BOTTOM_LEFT]._bounds.y) {
                        out.push.apply(out, this.nodes[Node.TOP_LEFT].getAllContent());
                    }
                    
                    if (item.y + item.height > this.nodes[Node.BOTTOM_LEFT]._bounds.y) {
                        out.push.apply(out, this.nodes[Node.BOTTOM_LEFT].getAllContent());
                    }
                }
                
                if (item.x + item.width > this.nodes[Node.TOP_RIGHT]._bounds.x) {//position+width bigger than middle x
                    if (item.y <= this.nodes[Node.BOTTOM_RIGHT]._bounds.y) {
                        out.push.apply(out, this.nodes[Node.TOP_RIGHT].getAllContent());
                    }
                    
                    if (item.y + item.height > this.nodes[Node.BOTTOM_RIGHT]._bounds.y) {
                        out.push.apply(out, this.nodes[Node.BOTTOM_RIGHT].getAllContent());
                    }
                }
            }
        }

        out.push.apply(out, this._stuckChildren);
        out.push.apply(out, this.children);

        return out;
    };

    //Returns all contents of node.
    BoundsNode.prototype.getAllContent = function () {
        var out = this._out;
        if (this.nodes.length) {
            
            var i;
            for (i = 0; i < this.nodes.length; i++) {
                this.nodes[i].getAllContent();
            }
        }
        out.push.apply(out, this._stuckChildren);
        out.push.apply(out, this.children);
        return out;
    };

    BoundsNode.prototype.clear = function () {

        this._stuckChildren.length = 0;

        //array
        this.children.length = 0;

        var len = this.nodes.length;

        if (!len) {
            return;
        }

        var i;
        for (i = 0; i < len; i++) {
            this.nodes[i].clear();
        }

        //array
        this.nodes.length = 0;

        //we could call the super clear function but for now, im just going to inline it
        //call the hidden super.clear, and make sure its called with this = this instance
        //Object.getPrototypeOf(BoundsNode.prototype).clear.call(this);
    };

    window.QuadTree = QuadTree;

}(window));
/*!
Copyright (C) 2010-2013 Raymond Hill
MIT License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md

Author: Raymond Hill (rhill@raymondhill.net)
Contributor: Jesse Morgan (morgajel@gmail.com)
File: rhill-voronoi-core.js
Version: 0.98
Date: January 21, 2013
Description: This is my personal Javascript implementation of
Steven Fortune's algorithm to compute Voronoi diagrams.

License: See https://github.com/gorhill/Javascript-Voronoi/LICENSE.md
Credits: See https://github.com/gorhill/Javascript-Voronoi/CREDITS.md
History: See https://github.com/gorhill/Javascript-Voronoi/CHANGELOG.md

## Usage:

  var sites = [{x:300,y:300}, {x:100,y:100}, {x:200,y:500}, {x:250,y:450}, {x:600,y:150}];
  // xl, xr means x left, x right
  // yt, yb means y top, y bottom
  var bbox = {xl:0, xr:800, yt:0, yb:600};
  var voronoi = new Voronoi();
  // pass an object which exhibits xl, xr, yt, yb properties. The bounding
  // box will be used to connect unbound edges, and to close open cells
  result = voronoi.compute(sites, bbox);
  // render, further analyze, etc.

Return value:
  An object with the following properties:

  result.vertices = an array of unordered, unique Voronoi.Vertex objects making
    up the Voronoi diagram.
  result.edges = an array of unordered, unique Voronoi.Edge objects making up
    the Voronoi diagram.
  result.cells = an array of Voronoi.Cell object making up the Voronoi diagram.
    A Cell object might have an empty array of halfedges, meaning no Voronoi
    cell could be computed for a particular cell.
  result.execTime = the time it took to compute the Voronoi diagram, in
    milliseconds.

Voronoi.Vertex object:
  x: The x position of the vertex.
  y: The y position of the vertex.

Voronoi.Edge object:
  lSite: the Voronoi site object at the left of this Voronoi.Edge object.
  rSite: the Voronoi site object at the right of this Voronoi.Edge object (can
    be null).
  va: an object with an 'x' and a 'y' property defining the start point
    (relative to the Voronoi site on the left) of this Voronoi.Edge object.
  vb: an object with an 'x' and a 'y' property defining the end point
    (relative to Voronoi site on the left) of this Voronoi.Edge object.

  For edges which are used to close open cells (using the supplied bounding
  box), the rSite property will be null.

Voronoi.Cell object:
  site: the Voronoi site object associated with the Voronoi cell.
  halfedges: an array of Voronoi.Halfedge objects, ordered counterclockwise,
    defining the polygon for this Voronoi cell.

Voronoi.Halfedge object:
  site: the Voronoi site object owning this Voronoi.Halfedge object.
  edge: a reference to the unique Voronoi.Edge object underlying this
    Voronoi.Halfedge object.
  getStartpoint(): a method returning an object with an 'x' and a 'y' property
    for the start point of this halfedge. Keep in mind halfedges are always
    countercockwise.
  getEndpoint(): a method returning an object with an 'x' and a 'y' property
    for the end point of this halfedge. Keep in mind halfedges are always
    countercockwise.

TODO: Identify opportunities for performance improvement.

TODO: Let the user close the Voronoi cells, do not do it automatically. Not only let
      him close the cells, but also allow him to close more than once using a different
      bounding box for the same Voronoi diagram.
*/

/*global Math */

// ---------------------------------------------------------------------------

function Voronoi() {
    this.vertices = null;
    this.edges = null;
    this.cells = null;
    this.toRecycle = null;
    this.beachsectionJunkyard = [];
    this.circleEventJunkyard = [];
    this.vertexJunkyard = [];
    this.edgeJunkyard = [];
    this.cellJunkyard = [];
}

// ---------------------------------------------------------------------------

Voronoi.prototype.reset = function() {
    if (!this.beachline) {
        this.beachline = new this.RBTree();
    }
    // Move leftover beachsections to the beachsection junkyard.
    if (this.beachline.root) {
        var beachsection = this.beachline.getFirst(this.beachline.root);
        while (beachsection) {
            this.beachsectionJunkyard.push(beachsection); // mark for reuse
            beachsection = beachsection.rbNext;
        }
    }
    this.beachline.root = null;
    if (!this.circleEvents) {
        this.circleEvents = new this.RBTree();
    }
    this.circleEvents.root = this.firstCircleEvent = null;
    this.vertices = [];
    this.edges = [];
    this.cells = [];
};

Voronoi.prototype.sqrt = Math.sqrt;
Voronoi.prototype.abs = Math.abs;
Voronoi.prototype.EPSILON = 1e-9;
Voronoi.prototype.equalWithEpsilon = function(a, b) {
    return this.abs(a - b) < 1e-9; };
Voronoi.prototype.greaterThanWithEpsilon = function(a, b) {
    return a - b > 1e-9; };
Voronoi.prototype.greaterThanOrEqualWithEpsilon = function(a, b) {
    return b - a < 1e-9; };
Voronoi.prototype.lessThanWithEpsilon = function(a, b) {
    return b - a > 1e-9; };
Voronoi.prototype.lessThanOrEqualWithEpsilon = function(a, b) {
    return a - b < 1e-9; };

// ---------------------------------------------------------------------------
// Red-Black tree code (based on C version of "rbtree" by Franck Bui-Huu
// https://github.com/fbuihuu/libtree/blob/master/rb.c

Voronoi.prototype.RBTree = function() {
    this.root = null;
};

Voronoi.prototype.RBTree.prototype.rbInsertSuccessor = function(node, successor) {
    var parent;
    if (node) {
        // >>> rhill 2011-05-27: Performance: cache previous/next nodes
        successor.rbPrevious = node;
        successor.rbNext = node.rbNext;
        if (node.rbNext) {
            node.rbNext.rbPrevious = successor;
        }
        node.rbNext = successor;
        // <<<
        if (node.rbRight) {
            // in-place expansion of node.rbRight.getFirst();
            node = node.rbRight;
            while (node.rbLeft) { node = node.rbLeft; }
            node.rbLeft = successor;
        } else {
            node.rbRight = successor;
        }
        parent = node;
    }
    // rhill 2011-06-07: if node is null, successor must be inserted
    // to the left-most part of the tree
    else if (this.root) {
        node = this.getFirst(this.root);
        // >>> Performance: cache previous/next nodes
        successor.rbPrevious = null;
        successor.rbNext = node;
        node.rbPrevious = successor;
        // <<<
        node.rbLeft = successor;
        parent = node;
    } else {
        // >>> Performance: cache previous/next nodes
        successor.rbPrevious = successor.rbNext = null;
        // <<<
        this.root = successor;
        parent = null;
    }
    successor.rbLeft = successor.rbRight = null;
    successor.rbParent = parent;
    successor.rbRed = true;
    // Fixup the modified tree by recoloring nodes and performing
    // rotations (2 at most) hence the red-black tree properties are
    // preserved.
    var grandpa, uncle;
    node = successor;
    while (parent && parent.rbRed) {
        grandpa = parent.rbParent;
        if (parent === grandpa.rbLeft) {
            uncle = grandpa.rbRight;
            if (uncle && uncle.rbRed) {
                parent.rbRed = uncle.rbRed = false;
                grandpa.rbRed = true;
                node = grandpa;
            } else {
                if (node === parent.rbRight) {
                    this.rbRotateLeft(parent);
                    node = parent;
                    parent = node.rbParent;
                }
                parent.rbRed = false;
                grandpa.rbRed = true;
                this.rbRotateRight(grandpa);
            }
        } else {
            uncle = grandpa.rbLeft;
            if (uncle && uncle.rbRed) {
                parent.rbRed = uncle.rbRed = false;
                grandpa.rbRed = true;
                node = grandpa;
            } else {
                if (node === parent.rbLeft) {
                    this.rbRotateRight(parent);
                    node = parent;
                    parent = node.rbParent;
                }
                parent.rbRed = false;
                grandpa.rbRed = true;
                this.rbRotateLeft(grandpa);
            }
        }
        parent = node.rbParent;
    }
    this.root.rbRed = false;
};

Voronoi.prototype.RBTree.prototype.rbRemoveNode = function(node) {
    // >>> rhill 2011-05-27: Performance: cache previous/next nodes
    if (node.rbNext) {
        node.rbNext.rbPrevious = node.rbPrevious;
    }
    if (node.rbPrevious) {
        node.rbPrevious.rbNext = node.rbNext;
    }
    node.rbNext = node.rbPrevious = null;
    // <<<
    var parent = node.rbParent,
        left = node.rbLeft,
        right = node.rbRight,
        next;
    if (!left) {
        next = right;
    } else if (!right) {
        next = left;
    } else {
        next = this.getFirst(right);
    }
    if (parent) {
        if (parent.rbLeft === node) {
            parent.rbLeft = next;
        } else {
            parent.rbRight = next;
        }
    } else {
        this.root = next;
    }
    // enforce red-black rules
    var isRed;
    if (left && right) {
        isRed = next.rbRed;
        next.rbRed = node.rbRed;
        next.rbLeft = left;
        left.rbParent = next;
        if (next !== right) {
            parent = next.rbParent;
            next.rbParent = node.rbParent;
            node = next.rbRight;
            parent.rbLeft = node;
            next.rbRight = right;
            right.rbParent = next;
        } else {
            next.rbParent = parent;
            parent = next;
            node = next.rbRight;
        }
    } else {
        isRed = node.rbRed;
        node = next;
    }
    // 'node' is now the sole successor's child and 'parent' its
    // new parent (since the successor can have been moved)
    if (node) {
        node.rbParent = parent;
    }
    // the 'easy' cases
    if (isRed) {
        return; }
    if (node && node.rbRed) {
        node.rbRed = false;
        return;
    }
    // the other cases
    var sibling;
    do {
        if (node === this.root) {
            break;
        }
        if (node === parent.rbLeft) {
            sibling = parent.rbRight;
            if (sibling.rbRed) {
                sibling.rbRed = false;
                parent.rbRed = true;
                this.rbRotateLeft(parent);
                sibling = parent.rbRight;
            }
            if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
                if (!sibling.rbRight || !sibling.rbRight.rbRed) {
                    sibling.rbLeft.rbRed = false;
                    sibling.rbRed = true;
                    this.rbRotateRight(sibling);
                    sibling = parent.rbRight;
                }
                sibling.rbRed = parent.rbRed;
                parent.rbRed = sibling.rbRight.rbRed = false;
                this.rbRotateLeft(parent);
                node = this.root;
                break;
            }
        } else {
            sibling = parent.rbLeft;
            if (sibling.rbRed) {
                sibling.rbRed = false;
                parent.rbRed = true;
                this.rbRotateRight(parent);
                sibling = parent.rbLeft;
            }
            if ((sibling.rbLeft && sibling.rbLeft.rbRed) || (sibling.rbRight && sibling.rbRight.rbRed)) {
                if (!sibling.rbLeft || !sibling.rbLeft.rbRed) {
                    sibling.rbRight.rbRed = false;
                    sibling.rbRed = true;
                    this.rbRotateLeft(sibling);
                    sibling = parent.rbLeft;
                }
                sibling.rbRed = parent.rbRed;
                parent.rbRed = sibling.rbLeft.rbRed = false;
                this.rbRotateRight(parent);
                node = this.root;
                break;
            }
        }
        sibling.rbRed = true;
        node = parent;
        parent = parent.rbParent;
    } while (!node.rbRed);
    if (node) { node.rbRed = false; }
};

Voronoi.prototype.RBTree.prototype.rbRotateLeft = function(node) {
    var p = node,
        q = node.rbRight, // can't be null
        parent = p.rbParent;
    if (parent) {
        if (parent.rbLeft === p) {
            parent.rbLeft = q;
        } else {
            parent.rbRight = q;
        }
    } else {
        this.root = q;
    }
    q.rbParent = parent;
    p.rbParent = q;
    p.rbRight = q.rbLeft;
    if (p.rbRight) {
        p.rbRight.rbParent = p;
    }
    q.rbLeft = p;
};

Voronoi.prototype.RBTree.prototype.rbRotateRight = function(node) {
    var p = node,
        q = node.rbLeft, // can't be null
        parent = p.rbParent;
    if (parent) {
        if (parent.rbLeft === p) {
            parent.rbLeft = q;
        } else {
            parent.rbRight = q;
        }
    } else {
        this.root = q;
    }
    q.rbParent = parent;
    p.rbParent = q;
    p.rbLeft = q.rbRight;
    if (p.rbLeft) {
        p.rbLeft.rbParent = p;
    }
    q.rbRight = p;
};

Voronoi.prototype.RBTree.prototype.getFirst = function(node) {
    while (node.rbLeft) {
        node = node.rbLeft;
    }
    return node;
};

Voronoi.prototype.RBTree.prototype.getLast = function(node) {
    while (node.rbRight) {
        node = node.rbRight;
    }
    return node;
};

// ---------------------------------------------------------------------------
// Diagram methods

Voronoi.prototype.Diagram = function(site) {
    this.site = site;
};

// ---------------------------------------------------------------------------
// Cell methods

Voronoi.prototype.Cell = function(site) {
    this.site = site;
    this.halfedges = [];
    this.closeMe = false;
};

Voronoi.prototype.Cell.prototype.init = function(site) {
    this.site = site;
    this.halfedges = [];
    this.closeMe = false;
    return this;
};

Voronoi.prototype.createCell = function(site) {
    var cell = this.cellJunkyard.pop();
    if (cell) {
        return cell.init(site);
    }
    return new this.Cell(site);
};

Voronoi.prototype.Cell.prototype.prepareHalfedges = function() {
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        edge;
    // get rid of unused halfedges
    // rhill 2011-05-27: Keep it simple, no point here in trying
    // to be fancy: dangling edges are a typically a minority.
    while (iHalfedge--) {
        edge = halfedges[iHalfedge].edge;
        if (!edge.vb || !edge.va) {
            halfedges.splice(iHalfedge, 1);
        }
    }

    // rhill 2011-05-26: I tried to use a binary search at insertion
    // time to keep the array sorted on-the-fly (in Cell.addHalfedge()).
    // There was no real benefits in doing so, performance on
    // Firefox 3.6 was improved marginally, while performance on
    // Opera 11 was penalized marginally.
    halfedges.sort(function(a, b) {
        return b.angle - a.angle; });
    return halfedges.length;
};

// Return a list of the neighbor Ids
Voronoi.prototype.Cell.prototype.getNeighborIds = function() {
    var neighbors = [],
        iHalfedge = this.halfedges.length,
        edge;
    while (iHalfedge--) {
        edge = this.halfedges[iHalfedge].edge;
        if (edge.lSite !== null && edge.lSite.voronoiId != this.site.voronoiId) {
            neighbors.push(edge.lSite.voronoiId);
        } else if (edge.rSite !== null && edge.rSite.voronoiId != this.site.voronoiId) {
            neighbors.push(edge.rSite.voronoiId);
        }
    }
    return neighbors;
};

// Compute bounding box
//
Voronoi.prototype.Cell.prototype.getBbox = function() {
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        xmin = Infinity,
        ymin = Infinity,
        xmax = -Infinity,
        ymax = -Infinity,
        v, vx, vy;
    while (iHalfedge--) {
        v = halfedges[iHalfedge].getStartpoint();
        vx = v.x;
        vy = v.y;
        if (vx < xmin) { xmin = vx; }
        if (vy < ymin) { ymin = vy; }
        if (vx > xmax) { xmax = vx; }
        if (vy > ymax) { ymax = vy; }
        // we dont need to take into account end point,
        // since each end point matches a start point
    }
    return {
        x: xmin,
        y: ymin,
        width: xmax - xmin,
        height: ymax - ymin
    };
};

// Return whether a point is inside, on, or outside the cell:
//   -1: point is outside the perimeter of the cell
//    0: point is on the perimeter of the cell
//    1: point is inside the perimeter of the cell
//
Voronoi.prototype.Cell.prototype.pointIntersection = function(x, y) {
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
    var halfedges = this.halfedges,
        iHalfedge = halfedges.length,
        halfedge,
        p0, p1, r;
    while (iHalfedge--) {
        halfedge = halfedges[iHalfedge];
        p0 = halfedge.getStartpoint();
        p1 = halfedge.getEndpoint();
        r = (y - p0.y) * (p1.x - p0.x) - (x - p0.x) * (p1.y - p0.y);
        if (!r) {
            return 0;
        }
        if (r > 0) {
            return -1;
        }
    }
    return 1;
};

// ---------------------------------------------------------------------------
// Edge methods
//

Voronoi.prototype.Vertex = function(x, y) {
    this.x = x;
    this.y = y;
};

Voronoi.prototype.Edge = function(lSite, rSite) {
    this.lSite = lSite;
    this.rSite = rSite;
    this.va = this.vb = null;
};

Voronoi.prototype.Halfedge = function(edge, lSite, rSite) {
    this.site = lSite;
    this.edge = edge;
    // 'angle' is a value to be used for properly sorting the
    // halfsegments counterclockwise. By convention, we will
    // use the angle of the line defined by the 'site to the left'
    // to the 'site to the right'.
    // However, border edges have no 'site to the right': thus we
    // use the angle of line perpendicular to the halfsegment (the
    // edge should have both end points defined in such case.)
    if (rSite) {
        this.angle = Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x);
    } else {
        var va = edge.va,
            vb = edge.vb;
        // rhill 2011-05-31: used to call getStartpoint()/getEndpoint(),
        // but for performance purpose, these are expanded in place here.
        this.angle = edge.lSite === lSite ?
            Math.atan2(vb.x - va.x, va.y - vb.y) :
            Math.atan2(va.x - vb.x, vb.y - va.y);
    }
};

Voronoi.prototype.createHalfedge = function(edge, lSite, rSite) {
    return new this.Halfedge(edge, lSite, rSite);
};

Voronoi.prototype.Halfedge.prototype.getStartpoint = function() {
    return this.edge.lSite === this.site ? this.edge.va : this.edge.vb;
};

Voronoi.prototype.Halfedge.prototype.getEndpoint = function() {
    return this.edge.lSite === this.site ? this.edge.vb : this.edge.va;
};



// this create and add a vertex to the internal collection

Voronoi.prototype.createVertex = function(x, y) {
    var v = this.vertexJunkyard.pop();
    if (!v) {
        v = new this.Vertex(x, y);
    } else {
        v.x = x;
        v.y = y;
    }
    this.vertices.push(v);
    return v;
};

// this create and add an edge to internal collection, and also create
// two halfedges which are added to each site's counterclockwise array
// of halfedges.

Voronoi.prototype.createEdge = function(lSite, rSite, va, vb) {
    var edge = this.edgeJunkyard.pop();
    if (!edge) {
        edge = new this.Edge(lSite, rSite);
    } else {
        edge.lSite = lSite;
        edge.rSite = rSite;
        edge.va = edge.vb = null;
    }

    this.edges.push(edge);
    if (va) {
        this.setEdgeStartpoint(edge, lSite, rSite, va);
    }
    if (vb) {
        this.setEdgeEndpoint(edge, lSite, rSite, vb);
    }
    this.cells[lSite.voronoiId].halfedges.push(this.createHalfedge(edge, lSite, rSite));
    this.cells[rSite.voronoiId].halfedges.push(this.createHalfedge(edge, rSite, lSite));
    return edge;
};

Voronoi.prototype.createBorderEdge = function(lSite, va, vb) {
    var edge = this.edgeJunkyard.pop();
    if (!edge) {
        edge = new this.Edge(lSite, null);
    } else {
        edge.lSite = lSite;
        edge.rSite = null;
    }
    edge.va = va;
    edge.vb = vb;
    this.edges.push(edge);
    return edge;
};

Voronoi.prototype.setEdgeStartpoint = function(edge, lSite, rSite, vertex) {
    if (!edge.va && !edge.vb) {
        edge.va = vertex;
        edge.lSite = lSite;
        edge.rSite = rSite;
    } else if (edge.lSite === rSite) {
        edge.vb = vertex;
    } else {
        edge.va = vertex;
    }
};

Voronoi.prototype.setEdgeEndpoint = function(edge, lSite, rSite, vertex) {
    this.setEdgeStartpoint(edge, rSite, lSite, vertex);
};

// ---------------------------------------------------------------------------
// Beachline methods

// rhill 2011-06-07: For some reasons, performance suffers significantly
// when instanciating a literal object instead of an empty ctor
Voronoi.prototype.Beachsection = function() {};

// rhill 2011-06-02: A lot of Beachsection instanciations
// occur during the computation of the Voronoi diagram,
// somewhere between the number of sites and twice the
// number of sites, while the number of Beachsections on the
// beachline at any given time is comparatively low. For this
// reason, we reuse already created Beachsections, in order
// to avoid new memory allocation. This resulted in a measurable
// performance gain.

Voronoi.prototype.createBeachsection = function(site) {
    var beachsection = this.beachsectionJunkyard.pop();
    if (!beachsection) {
        beachsection = new this.Beachsection();
    }
    beachsection.site = site;
    return beachsection;
};

// calculate the left break point of a particular beach section,
// given a particular sweep line
Voronoi.prototype.leftBreakPoint = function(arc, directrix) {
    // http://en.wikipedia.org/wiki/Parabola
    // http://en.wikipedia.org/wiki/Quadratic_equation
    // h1 = x1,
    // k1 = (y1+directrix)/2,
    // h2 = x2,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = -h1/(2*p1),
    // c1 = h1*h1/(4*p1)+k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-(b2-b1) + Math.sqrt((b2-b1)*(b2-b1) - 4*(a2-a1)*(c2-c1))) / (2*(a2-a1))
    // When x1 become the x-origin:
    // h1 = 0,
    // k1 = (y1+directrix)/2,
    // h2 = x2-x1,
    // k2 = (y2+directrix)/2,
    // p1 = k1-directrix,
    // a1 = 1/(4*p1),
    // b1 = 0,
    // c1 = k1,
    // p2 = k2-directrix,
    // a2 = 1/(4*p2),
    // b2 = -h2/(2*p2),
    // c2 = h2*h2/(4*p2)+k2,
    // x = (-b2 + Math.sqrt(b2*b2 - 4*(a2-a1)*(c2-k1))) / (2*(a2-a1)) + x1

    // change code below at your own risk: care has been taken to
    // reduce errors due to computers' finite arithmetic precision.
    // Maybe can still be improved, will see if any more of this
    // kind of errors pop up again.
    var site = arc.site,
        rfocx = site.x,
        rfocy = site.y,
        pby2 = rfocy - directrix;
    // parabola in degenerate case where focus is on directrix
    if (!pby2) {
        return rfocx;
    }
    var lArc = arc.rbPrevious;
    if (!lArc) {
        return -Infinity;
    }
    site = lArc.site;
    var lfocx = site.x,
        lfocy = site.y,
        plby2 = lfocy - directrix;
    // parabola in degenerate case where focus is on directrix
    if (!plby2) {
        return lfocx;
    }
    var hl = lfocx - rfocx,
        aby2 = 1 / pby2 - 1 / plby2,
        b = hl / plby2;
    if (aby2) {
        return (-b + this.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    }
    // both parabolas have same distance to directrix, thus break point is midway
    return (rfocx + lfocx) / 2;
};

// calculate the right break point of a particular beach section,
// given a particular directrix
Voronoi.prototype.rightBreakPoint = function(arc, directrix) {
    var rArc = arc.rbNext;
    if (rArc) {
        return this.leftBreakPoint(rArc, directrix);
    }
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
};

Voronoi.prototype.detachBeachsection = function(beachsection) {
    this.detachCircleEvent(beachsection); // detach potentially attached circle event
    this.beachline.rbRemoveNode(beachsection); // remove from RB-tree
    this.beachsectionJunkyard.push(beachsection); // mark for reuse
};

Voronoi.prototype.removeBeachsection = function(beachsection) {
    var circle = beachsection.circleEvent,
        x = circle.x,
        y = circle.ycenter,
        vertex = this.createVertex(x, y),
        previous = beachsection.rbPrevious,
        next = beachsection.rbNext,
        disappearingTransitions = [beachsection],
        abs_fn = Math.abs;

    // remove collapsed beachsection from beachline
    this.detachBeachsection(beachsection);

    // there could be more than one empty arc at the deletion point, this
    // happens when more than two edges are linked by the same vertex,
    // so we will collect all those edges by looking up both sides of
    // the deletion point.
    // by the way, there is *always* a predecessor/successor to any collapsed
    // beach section, it's just impossible to have a collapsing first/last
    // beach sections on the beachline, since they obviously are unconstrained
    // on their left/right side.

    // look left
    var lArc = previous;
    while (lArc.circleEvent && abs_fn(x - lArc.circleEvent.x) < 1e-9 && abs_fn(y - lArc.circleEvent.ycenter) < 1e-9) {
        previous = lArc.rbPrevious;
        disappearingTransitions.unshift(lArc);
        this.detachBeachsection(lArc); // mark for reuse
        lArc = previous;
    }
    // even though it is not disappearing, I will also add the beach section
    // immediately to the left of the left-most collapsed beach section, for
    // convenience, since we need to refer to it later as this beach section
    // is the 'left' site of an edge for which a start point is set.
    disappearingTransitions.unshift(lArc);
    this.detachCircleEvent(lArc);

    // look right
    var rArc = next;
    while (rArc.circleEvent && abs_fn(x - rArc.circleEvent.x) < 1e-9 && abs_fn(y - rArc.circleEvent.ycenter) < 1e-9) {
        next = rArc.rbNext;
        disappearingTransitions.push(rArc);
        this.detachBeachsection(rArc); // mark for reuse
        rArc = next;
    }
    // we also have to add the beach section immediately to the right of the
    // right-most collapsed beach section, since there is also a disappearing
    // transition representing an edge's start point on its left.
    disappearingTransitions.push(rArc);
    this.detachCircleEvent(rArc);

    // walk through all the disappearing transitions between beach sections and
    // set the start point of their (implied) edge.
    var nArcs = disappearingTransitions.length,
        iArc;
    for (iArc = 1; iArc < nArcs; iArc++) {
        rArc = disappearingTransitions[iArc];
        lArc = disappearingTransitions[iArc - 1];
        this.setEdgeStartpoint(rArc.edge, lArc.site, rArc.site, vertex);
    }

    // create a new edge as we have now a new transition between
    // two beach sections which were previously not adjacent.
    // since this edge appears as a new vertex is defined, the vertex
    // actually define an end point of the edge (relative to the site
    // on the left)
    lArc = disappearingTransitions[0];
    rArc = disappearingTransitions[nArcs - 1];
    rArc.edge = this.createEdge(lArc.site, rArc.site, undefined, vertex);

    // create circle events if any for beach sections left in the beachline
    // adjacent to collapsed sections
    this.attachCircleEvent(lArc);
    this.attachCircleEvent(rArc);
};

Voronoi.prototype.addBeachsection = function(site) {
    var x = site.x,
        directrix = site.y;

    // find the left and right beach sections which will surround the newly
    // created beach section.
    // rhill 2011-06-01: This loop is one of the most often executed,
    // hence we expand in-place the comparison-against-epsilon calls.
    var lArc, rArc,
        dxl, dxr,
        node = this.beachline.root;

    while (node) {
        dxl = this.leftBreakPoint(node, directrix) - x;
        // x lessThanWithEpsilon xl => falls somewhere before the left edge of the beachsection
        if (dxl > 1e-9) {
            // this case should never happen
            // if (!node.rbLeft) {
            //    rArc = node.rbLeft;
            //    break;
            //    }
            node = node.rbLeft;
        } else {
            dxr = x - this.rightBreakPoint(node, directrix);
            // x greaterThanWithEpsilon xr => falls somewhere after the right edge of the beachsection
            if (dxr > 1e-9) {
                if (!node.rbRight) {
                    lArc = node;
                    break;
                }
                node = node.rbRight;
            } else {
                // x equalWithEpsilon xl => falls exactly on the left edge of the beachsection
                if (dxl > -1e-9) {
                    lArc = node.rbPrevious;
                    rArc = node;
                }
                // x equalWithEpsilon xr => falls exactly on the right edge of the beachsection
                else if (dxr > -1e-9) {
                    lArc = node;
                    rArc = node.rbNext;
                }
                // falls exactly somewhere in the middle of the beachsection
                else {
                    lArc = rArc = node;
                }
                break;
            }
        }
    }
    // at this point, keep in mind that lArc and/or rArc could be
    // undefined or null.

    // create a new beach section object for the site and add it to RB-tree
    var newArc = this.createBeachsection(site);
    this.beachline.rbInsertSuccessor(lArc, newArc);

    // cases:
    //

    // [null,null]
    // least likely case: new beach section is the first beach section on the
    // beachline.
    // This case means:
    //   no new transition appears
    //   no collapsing beach section
    //   new beachsection become root of the RB-tree
    if (!lArc && !rArc) {
        return;
    }

    // [lArc,rArc] where lArc == rArc
    // most likely case: new beach section split an existing beach
    // section.
    // This case means:
    //   one new transition appears
    //   the left and right beach section might be collapsing as a result
    //   two new nodes added to the RB-tree
    if (lArc === rArc) {
        // invalidate circle event of split beach section
        this.detachCircleEvent(lArc);

        // split the beach section into two separate beach sections
        rArc = this.createBeachsection(lArc.site);
        this.beachline.rbInsertSuccessor(newArc, rArc);

        // since we have a new transition between two beach sections,
        // a new edge is born
        newArc.edge = rArc.edge = this.createEdge(lArc.site, newArc.site);

        // check whether the left and right beach sections are collapsing
        // and if so create circle events, to be notified when the point of
        // collapse is reached.
        this.attachCircleEvent(lArc);
        this.attachCircleEvent(rArc);
        return;
    }

    // [lArc,null]
    // even less likely case: new beach section is the *last* beach section
    // on the beachline -- this can happen *only* if *all* the previous beach
    // sections currently on the beachline share the same y value as
    // the new beach section.
    // This case means:
    //   one new transition appears
    //   no collapsing beach section as a result
    //   new beach section become right-most node of the RB-tree
    if (lArc && !rArc) {
        newArc.edge = this.createEdge(lArc.site, newArc.site);
        return;
    }

    // [null,rArc]
    // impossible case: because sites are strictly processed from top to bottom,
    // and left to right, which guarantees that there will always be a beach section
    // on the left -- except of course when there are no beach section at all on
    // the beach line, which case was handled above.
    // rhill 2011-06-02: No point testing in non-debug version
    //if (!lArc && rArc) {
    //    throw "Voronoi.addBeachsection(): What is this I don't even";
    //    }

    // [lArc,rArc] where lArc != rArc
    // somewhat less likely case: new beach section falls *exactly* in between two
    // existing beach sections
    // This case means:
    //   one transition disappears
    //   two new transitions appear
    //   the left and right beach section might be collapsing as a result
    //   only one new node added to the RB-tree
    if (lArc !== rArc) {
        // invalidate circle events of left and right sites
        this.detachCircleEvent(lArc);
        this.detachCircleEvent(rArc);

        // an existing transition disappears, meaning a vertex is defined at
        // the disappearance point.
        // since the disappearance is caused by the new beachsection, the
        // vertex is at the center of the circumscribed circle of the left,
        // new and right beachsections.
        // http://mathforum.org/library/drmath/view/55002.html
        // Except that I bring the origin at A to simplify
        // calculation
        var lSite = lArc.site,
            ax = lSite.x,
            ay = lSite.y,
            bx = site.x - ax,
            by = site.y - ay,
            rSite = rArc.site,
            cx = rSite.x - ax,
            cy = rSite.y - ay,
            d = 2 * (bx * cy - by * cx),
            hb = bx * bx + by * by,
            hc = cx * cx + cy * cy,
            vertex = this.createVertex((cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay);

        // one transition disappear
        this.setEdgeStartpoint(rArc.edge, lSite, rSite, vertex);

        // two new transitions appear at the new vertex location
        newArc.edge = this.createEdge(lSite, site, undefined, vertex);
        rArc.edge = this.createEdge(site, rSite, undefined, vertex);

        // check whether the left and right beach sections are collapsing
        // and if so create circle events, to handle the point of collapse.
        this.attachCircleEvent(lArc);
        this.attachCircleEvent(rArc);
        return;
    }
};

// ---------------------------------------------------------------------------
// Circle event methods

// rhill 2011-06-07: For some reasons, performance suffers significantly
// when instanciating a literal object instead of an empty ctor
Voronoi.prototype.CircleEvent = function() {
    // rhill 2013-10-12: it helps to state exactly what we are at ctor time.
    this.arc = null;
    this.rbLeft = null;
    this.rbNext = null;
    this.rbParent = null;
    this.rbPrevious = null;
    this.rbRed = false;
    this.rbRight = null;
    this.site = null;
    this.x = this.y = this.ycenter = 0;
};

Voronoi.prototype.attachCircleEvent = function(arc) {
    var lArc = arc.rbPrevious,
        rArc = arc.rbNext;
    if (!lArc || !rArc) {
        return; } // does that ever happen?
    var lSite = lArc.site,
        cSite = arc.site,
        rSite = rArc.site;

    // If site of left beachsection is same as site of
    // right beachsection, there can't be convergence
    if (lSite === rSite) {
        return; }

    // Find the circumscribed circle for the three sites associated
    // with the beachsection triplet.
    // rhill 2011-05-26: It is more efficient to calculate in-place
    // rather than getting the resulting circumscribed circle from an
    // object returned by calling Voronoi.circumcircle()
    // http://mathforum.org/library/drmath/view/55002.html
    // Except that I bring the origin at cSite to simplify calculations.
    // The bottom-most part of the circumcircle is our Fortune 'circle
    // event', and its center is a vertex potentially part of the final
    // Voronoi diagram.
    var bx = cSite.x,
        by = cSite.y,
        ax = lSite.x - bx,
        ay = lSite.y - by,
        cx = rSite.x - bx,
        cy = rSite.y - by;

    // If points l->c->r are clockwise, then center beach section does not
    // collapse, hence it can't end up as a vertex (we reuse 'd' here, which
    // sign is reverse of the orientation, hence we reverse the test.
    // http://en.wikipedia.org/wiki/Curve_orientation#Orientation_of_a_simple_polygon
    // rhill 2011-05-21: Nasty finite precision error which caused circumcircle() to
    // return infinites: 1e-12 seems to fix the problem.
    var d = 2 * (ax * cy - ay * cx);
    if (d >= -2e-12) {
        return; }

    var ha = ax * ax + ay * ay,
        hc = cx * cx + cy * cy,
        x = (cy * ha - ay * hc) / d,
        y = (ax * hc - cx * ha) / d,
        ycenter = y + by;

    // Important: ybottom should always be under or at sweep, so no need
    // to waste CPU cycles by checking

    // recycle circle event object if possible
    var circleEvent = this.circleEventJunkyard.pop();
    if (!circleEvent) {
        circleEvent = new this.CircleEvent();
    }
    circleEvent.arc = arc;
    circleEvent.site = cSite;
    circleEvent.x = x + bx;
    circleEvent.y = ycenter + this.sqrt(x * x + y * y); // y bottom
    circleEvent.ycenter = ycenter;
    arc.circleEvent = circleEvent;

    // find insertion point in RB-tree: circle events are ordered from
    // smallest to largest
    var predecessor = null,
        node = this.circleEvents.root;
    while (node) {
        if (circleEvent.y < node.y || (circleEvent.y === node.y && circleEvent.x <= node.x)) {
            if (node.rbLeft) {
                node = node.rbLeft;
            } else {
                predecessor = node.rbPrevious;
                break;
            }
        } else {
            if (node.rbRight) {
                node = node.rbRight;
            } else {
                predecessor = node;
                break;
            }
        }
    }
    this.circleEvents.rbInsertSuccessor(predecessor, circleEvent);
    if (!predecessor) {
        this.firstCircleEvent = circleEvent;
    }
};

Voronoi.prototype.detachCircleEvent = function(arc) {
    var circleEvent = arc.circleEvent;
    if (circleEvent) {
        if (!circleEvent.rbPrevious) {
            this.firstCircleEvent = circleEvent.rbNext;
        }
        this.circleEvents.rbRemoveNode(circleEvent); // remove from RB-tree
        this.circleEventJunkyard.push(circleEvent);
        arc.circleEvent = null;
    }
};

// ---------------------------------------------------------------------------
// Diagram completion methods

// connect dangling edges (not if a cursory test tells us
// it is not going to be visible.
// return value:
//   false: the dangling endpoint couldn't be connected
//   true: the dangling endpoint could be connected
Voronoi.prototype.connectEdge = function(edge, bbox) {
    // skip if end point already connected
    var vb = edge.vb;
    if (!!vb) {
        return true; }

    // make local copy for performance purpose
    var va = edge.va,
        xl = bbox.xl,
        xr = bbox.xr,
        yt = bbox.yt,
        yb = bbox.yb,
        lSite = edge.lSite,
        rSite = edge.rSite,
        lx = lSite.x,
        ly = lSite.y,
        rx = rSite.x,
        ry = rSite.y,
        fx = (lx + rx) / 2,
        fy = (ly + ry) / 2,
        fm, fb;

    // if we reach here, this means cells which use this edge will need
    // to be closed, whether because the edge was removed, or because it
    // was connected to the bounding box.
    this.cells[lSite.voronoiId].closeMe = true;
    this.cells[rSite.voronoiId].closeMe = true;

    // get the line equation of the bisector if line is not vertical
    if (ry !== ly) {
        fm = (lx - rx) / (ry - ly);
        fb = fy - fm * fx;
    }

    // remember, direction of line (relative to left site):
    // upward: left.x < right.x
    // downward: left.x > right.x
    // horizontal: left.x == right.x
    // upward: left.x < right.x
    // rightward: left.y < right.y
    // leftward: left.y > right.y
    // vertical: left.y == right.y

    // depending on the direction, find the best side of the
    // bounding box to use to determine a reasonable start point

    // special case: vertical line
    if (fm === undefined) {
        // doesn't intersect with viewport
        if (fx < xl || fx >= xr) {
            return false; }
        // downward
        if (lx > rx) {
            if (!va) {
                va = this.createVertex(fx, yt);
            } else if (va.y >= yb) {
                return false;
            }
            vb = this.createVertex(fx, yb);
        }
        // upward
        else {
            if (!va) {
                va = this.createVertex(fx, yb);
            } else if (va.y < yt) {
                return false;
            }
            vb = this.createVertex(fx, yt);
        }
    }
    // closer to vertical than horizontal, connect start point to the
    // top or bottom side of the bounding box
    else if (fm < -1 || fm > 1) {
        // downward
        if (lx > rx) {
            if (!va) {
                va = this.createVertex((yt - fb) / fm, yt);
            } else if (va.y >= yb) {
                return false;
            }
            vb = this.createVertex((yb - fb) / fm, yb);
        }
        // upward
        else {
            if (!va) {
                va = this.createVertex((yb - fb) / fm, yb);
            } else if (va.y < yt) {
                return false;
            }
            vb = this.createVertex((yt - fb) / fm, yt);
        }
    }
    // closer to horizontal than vertical, connect start point to the
    // left or right side of the bounding box
    else {
        // rightward
        if (ly < ry) {
            if (!va) {
                va = this.createVertex(xl, fm * xl + fb);
            } else if (va.x >= xr) {
                return false;
            }
            vb = this.createVertex(xr, fm * xr + fb);
        }
        // leftward
        else {
            if (!va) {
                va = this.createVertex(xr, fm * xr + fb);
            } else if (va.x < xl) {
                return false;
            }
            vb = this.createVertex(xl, fm * xl + fb);
        }
    }
    edge.va = va;
    edge.vb = vb;

    return true;
};

// line-clipping code taken from:
//   Liang-Barsky function by Daniel White
//   http://www.skytopia.com/project/articles/compsci/clipping.html
// Thanks!
// A bit modified to minimize code paths
Voronoi.prototype.clipEdge = function(edge, bbox) {
    var ax = edge.va.x,
        ay = edge.va.y,
        bx = edge.vb.x,
        by = edge.vb.y,
        t0 = 0,
        t1 = 1,
        dx = bx - ax,
        dy = by - ay;
    // left
    var q = ax - bbox.xl;
    if (dx === 0 && q < 0) {
        return false; }
    var r = -q / dx;
    if (dx < 0) {
        if (r < t0) {
            return false; }
        if (r < t1) { t1 = r; }
    } else if (dx > 0) {
        if (r > t1) {
            return false; }
        if (r > t0) { t0 = r; }
    }
    // right
    q = bbox.xr - ax;
    if (dx === 0 && q < 0) {
        return false; }
    r = q / dx;
    if (dx < 0) {
        if (r > t1) {
            return false; }
        if (r > t0) { t0 = r; }
    } else if (dx > 0) {
        if (r < t0) {
            return false; }
        if (r < t1) { t1 = r; }
    }
    // top
    q = ay - bbox.yt;
    if (dy === 0 && q < 0) {
        return false; }
    r = -q / dy;
    if (dy < 0) {
        if (r < t0) {
            return false; }
        if (r < t1) { t1 = r; }
    } else if (dy > 0) {
        if (r > t1) {
            return false; }
        if (r > t0) { t0 = r; }
    }
    // bottom        
    q = bbox.yb - ay;
    if (dy === 0 && q < 0) {
        return false; }
    r = q / dy;
    if (dy < 0) {
        if (r > t1) {
            return false; }
        if (r > t0) { t0 = r; }
    } else if (dy > 0) {
        if (r < t0) {
            return false; }
        if (r < t1) { t1 = r; }
    }

    // if we reach this point, Voronoi edge is within bbox

    // if t0 > 0, va needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge
    if (t0 > 0) {
        edge.va = this.createVertex(ax + t0 * dx, ay + t0 * dy);
    }

    // if t1 < 1, vb needs to change
    // rhill 2011-06-03: we need to create a new vertex rather
    // than modifying the existing one, since the existing
    // one is likely shared with at least another edge
    if (t1 < 1) {
        edge.vb = this.createVertex(ax + t1 * dx, ay + t1 * dy);
    }

    // va and/or vb were clipped, thus we will need to close
    // cells which use this edge.
    if (t0 > 0 || t1 < 1) {
        this.cells[edge.lSite.voronoiId].closeMe = true;
        this.cells[edge.rSite.voronoiId].closeMe = true;
    }

    return true;
};

// Connect/cut edges at bounding box
Voronoi.prototype.clipEdges = function(bbox) {
    // connect all dangling edges to bounding box
    // or get rid of them if it can't be done
    var edges = this.edges,
        iEdge = edges.length,
        edge,
        abs_fn = Math.abs;

    // iterate backward so we can splice safely
    while (iEdge--) {
        edge = edges[iEdge];
        // edge is removed if:
        //   it is wholly outside the bounding box
        //   it is looking more like a point than a line
        if (!this.connectEdge(edge, bbox) ||
            !this.clipEdge(edge, bbox) ||
            (abs_fn(edge.va.x - edge.vb.x) < 1e-9 && abs_fn(edge.va.y - edge.vb.y) < 1e-9)) {
            edge.va = edge.vb = null;
            edges.splice(iEdge, 1);
        }
    }
};

// Close the cells.
// The cells are bound by the supplied bounding box.
// Each cell refers to its associated site, and a list
// of halfedges ordered counterclockwise.
Voronoi.prototype.closeCells = function(bbox) {
    var xl = bbox.xl,
        xr = bbox.xr,
        yt = bbox.yt,
        yb = bbox.yb,
        cells = this.cells,
        iCell = cells.length,
        cell,
        iLeft,
        halfedges, nHalfedges,
        edge,
        va, vb, vz,
        lastBorderSegment,
        abs_fn = Math.abs;

    while (iCell--) {
        cell = cells[iCell];
        // prune, order halfedges counterclockwise, then add missing ones
        // required to close cells
        if (!cell.prepareHalfedges()) {
            continue;
        }
        if (!cell.closeMe) {
            continue;
        }
        // find first 'unclosed' point.
        // an 'unclosed' point will be the end point of a halfedge which
        // does not match the start point of the following halfedge
        halfedges = cell.halfedges;
        nHalfedges = halfedges.length;
        // special case: only one site, in which case, the viewport is the cell
        // ...

        // all other cases
        iLeft = 0;
        while (iLeft < nHalfedges) {
            va = halfedges[iLeft].getEndpoint();
            vz = halfedges[(iLeft + 1) % nHalfedges].getStartpoint();
            // if end point is not equal to start point, we need to add the missing
            // halfedge(s) to close the cell
            if (abs_fn(va.x - vz.x) >= 1e-9 || abs_fn(va.y - vz.y) >= 1e-9) {
                break;
            }
            iLeft++;
        }
        if (iLeft === nHalfedges) {
            continue;
        }
        // if we reach this point, cell needs to be closed by walking
        // counterclockwise along the bounding box until it connects
        // to next halfedge in the list

        // find entry point:
        switch (true) {

            // walk downward along left side
            case this.equalWithEpsilon(va.x, xl) && this.lessThanWithEpsilon(va.y, yb):
                lastBorderSegment = this.equalWithEpsilon(vz.x, xl);
                vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                edge = this.createBorderEdge(cell.site, va, vb);
                iLeft++;
                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                if (lastBorderSegment) {
                    break; }
                va = vb;

                // walk rightward along bottom side
            case this.equalWithEpsilon(va.y, yb) && this.lessThanWithEpsilon(va.x, xr):
                lastBorderSegment = this.equalWithEpsilon(vz.y, yb);
                vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                edge = this.createBorderEdge(cell.site, va, vb);
                iLeft++;
                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                if (lastBorderSegment) {
                    break; }
                va = vb;

                // walk upward along right side
            case this.equalWithEpsilon(va.x, xr) && this.greaterThanWithEpsilon(va.y, yt):
                lastBorderSegment = this.equalWithEpsilon(vz.x, xr);
                vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                edge = this.createBorderEdge(cell.site, va, vb);
                iLeft++;
                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                if (lastBorderSegment) {
                    break; }
                va = vb;

                // walk leftward along top side
            case this.equalWithEpsilon(va.y, yt) && this.greaterThanWithEpsilon(va.x, xl):
                lastBorderSegment = this.equalWithEpsilon(vz.y, yt);
                vb = this.createVertex(lastBorderSegment ? vz.x : xl, yt);
                edge = this.createBorderEdge(cell.site, va, vb);
                iLeft++;
                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                if (lastBorderSegment) {
                    break; }
                va = vb;

                // walk downward along left side
                lastBorderSegment = this.equalWithEpsilon(vz.x, xl);
                vb = this.createVertex(xl, lastBorderSegment ? vz.y : yb);
                edge = this.createBorderEdge(cell.site, va, vb);
                iLeft++;
                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                if (lastBorderSegment) {
                    break; }
                va = vb;

                // walk rightward along bottom side
                lastBorderSegment = this.equalWithEpsilon(vz.y, yb);
                vb = this.createVertex(lastBorderSegment ? vz.x : xr, yb);
                edge = this.createBorderEdge(cell.site, va, vb);
                iLeft++;
                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                if (lastBorderSegment) {
                    break; }
                va = vb;

                // walk upward along right side
                lastBorderSegment = this.equalWithEpsilon(vz.x, xr);
                vb = this.createVertex(xr, lastBorderSegment ? vz.y : yt);
                edge = this.createBorderEdge(cell.site, va, vb);
                iLeft++;
                halfedges.splice(iLeft, 0, this.createHalfedge(edge, cell.site, null));
                break;

            default:
                throw "Voronoi.closeCells() > this makes no sense!";
        }

        // At this point, all halfedges should be connected, or else
        // this means something went horribly wrong.
        if (abs_fn(vb.x - vz.x) >= 1e-9 || abs_fn(vb.y - vz.y) >= 1e-9) {
            throw "Voronoi.closeCells() > Could not close the Voronoi cell!\n  (See https://github.com/gorhill/Javascript-Voronoi/issues/15)";
        }

        // cell.closeMe = false;
    }
};

// ---------------------------------------------------------------------------
// Debugging helper
/*
Voronoi.prototype.dumpBeachline = function(y) {
    console.log('Voronoi.dumpBeachline() > Beachsections, from left to right:');
    if ( !this.beachline ) {
        console.log('  None');
        }
    else {
        var bs = this.beachline.getFirst(this.beachline.root);
        while ( bs ) {
            console.log('  site %d: xl: %f, xr: %f', bs.site.voronoiId, this.leftBreakPoint(bs, y), this.rightBreakPoint(bs, y));
            bs = bs.rbNext;
            }
        }
    };
*/

// ---------------------------------------------------------------------------
// Helper: Quantize sites

// rhill 2013-10-12:
// This is to solve https://github.com/gorhill/Javascript-Voronoi/issues/15
// Since not all users will end up using the kind of coord values which would
// cause the issue to arise, I chose to let the user decide whether or not
// he should sanitize his coord values through this helper. This way, for
// those users who uses coord values which are known to be fine, no overhead is
// added.

Voronoi.prototype.quantizeSites = function(sites) {
    var Îµ = this.EPSILON,
        n = sites.length,
        site;
    while (n--) {
        site = sites[n];
        site.x = Math.floor(site.x / Îµ) * Îµ;
        site.y = Math.floor(site.y / Îµ) * Îµ;
    }
};

// ---------------------------------------------------------------------------
// Helper: Recycle diagram: all vertex, edge and cell objects are
// "surrendered" to the Voronoi object for reuse.
// TODO: rhill-voronoi-core v2: more performance to be gained
// when I change the semantic of what is returned.

Voronoi.prototype.recycle = function(diagram) {
    if (diagram) {
        if (diagram instanceof this.Diagram) {
            this.toRecycle = diagram;
        } else {
            throw 'Voronoi.recycleDiagram() > Need a Diagram object.';
        }
    }
};

// ---------------------------------------------------------------------------
// Top-level Fortune loop

// rhill 2011-05-19:
//   Voronoi sites are kept client-side now, to allow
//   user to freely modify content. At compute time,
//   *references* to sites are copied locally.

Voronoi.prototype.compute = function(sites, bbox) {
    // to measure execution time
    var startTime = new Date();

    // init internal state
    this.reset();

    // any diagram data available for recycling?
    // I do that here so that this is included in execution time
    if (this.toRecycle) {
        this.vertexJunkyard = this.vertexJunkyard.concat(this.toRecycle.vertices);
        this.edgeJunkyard = this.edgeJunkyard.concat(this.toRecycle.edges);
        this.cellJunkyard = this.cellJunkyard.concat(this.toRecycle.cells);
        this.toRecycle = null;
    }

    // Initialize site event queue
    var siteEvents = sites.slice(0);
    siteEvents.sort(function(a, b) {
        var r = b.y - a.y;
        if (r) {
            return r; }
        return b.x - a.x;
    });

    // process queue
    var site = siteEvents.pop(),
        siteid = 0,
        xsitex, // to avoid duplicate sites
        xsitey,
        cells = this.cells,
        circle;

    // main loop
    for (;;) {
        // we need to figure whether we handle a site or circle event
        // for this we find out if there is a site event and it is
        // 'earlier' than the circle event
        circle = this.firstCircleEvent;

        // add beach section
        if (site && (!circle || site.y < circle.y || (site.y === circle.y && site.x < circle.x))) {
            // only if site is not a duplicate
            if (site.x !== xsitex || site.y !== xsitey) {
                // first create cell for new site
                cells[siteid] = this.createCell(site);
                site.voronoiId = siteid++;
                // then create a beachsection for that site
                this.addBeachsection(site);
                // remember last site coords to detect duplicate
                xsitey = site.y;
                xsitex = site.x;
            }
            site = siteEvents.pop();
        }

        // remove beach section
        else if (circle) {
            this.removeBeachsection(circle.arc);
        }

        // all done, quit
        else {
            break;
        }
    }

    // wrapping-up:
    //   connect dangling edges to bounding box
    //   cut edges as per bounding box
    //   discard edges completely outside bounding box
    //   discard edges which are point-like
    this.clipEdges(bbox);

    //   add missing edges in order to close opened cells
    this.closeCells(bbox);

    // to measure execution time
    var stopTime = new Date();

    // prepare return values
    var diagram = new this.Diagram();
    diagram.cells = this.cells;
    diagram.edges = this.edges;
    diagram.vertices = this.vertices;
    diagram.execTime = stopTime.getTime() - startTime.getTime();

    // clean up
    this.reset();

    return diagram;
};

var app = angular.module('conkr', ['ngSanitize']).controller('chatController', function($scope, mapFact, miscFact) {
	$scope.prevSent = [];
    $scope.msgs = [{
    	now:new Date().toLocaleTimeString(),
    	usr:'system',
    	msg:'Welcome to Conkr! chat. "/inv": toggle color modes, "/time": toggle timestamp, "/l": switch to local chat (only works if you\'re in a game!), "/a": switch to all chat',
        local:false
    }];
    $scope.user = null;
    $scope.msgInp = '';
    miscFact.getUsr().then(function(r) {
        if (!r.data || !r.data.name) {
            throw new Error('User not found or not logged in!');
        } else {
            $scope.user = r.data.name;
        }
    });
    socket.on('newMsg', function(msg) {
        msg.now = new Date().toLocaleTimeString();
        // if ($scope.msgs.length>1 && !$scope.maxMsg)
        if ($scope.msgs.length > 8) {
            $scope.msgs.shift();
        }
        $scope.msgs.push(msg);
        console.log($scope.msgs);
        $scope.$digest();
        $('.chat-cont').scrollTop(parseInt($('.chat-cont').height()));
    });
    $scope.sendMsg = function() {
        if ($scope.msgInp == '/time') {
            $scope.timeStamp = !$scope.timeStamp;
        } else if ($scope.msgInp == '/inv') {
        	$scope.invCol = !$scope.invCol;
        }else if($scope.msgInp == '/l' && $scope.$parent.gameId){
            $scope.chatLocal = true;
        }else if($scope.msgInp == '/l' && !$scope.$parent.gameId){
            // do nothin
        }else if($scope.msgInp == '/a'){
            $scope.chatLocal = false;
        }else if($scope.msgInp===''){
            return false;
        }else {
            socket.emit('sendMsg', { msg: $scope.msgInp, usr: $scope.user, local:!!$scope.$parent.gameId});
        }
        $scope.prevSent.push($scope.msgInp);
        $scope.currPrevMsg = $scope.prevSent.length;
        $scope.msgInp = '';
        $('#msgInp').focus();
    };
    document.querySelector('#msgInp').addEventListener('keyup',function(e){
    	//38 == up, 40==down
    	if (e.which==38){
    		e.preventDefault();
    		if($scope.prevSent.length && $scope.currPrevMsg>0){
    			$scope.currPrevMsg--;
    			$scope.msgInp = $scope.prevSent[$scope.currPrevMsg];
    		}
    		$scope.$digest();
    	}else if(e.which==40){
    		e.preventDefault();
    		if($scope.prevSent.length && $scope.currPrevMsg<$scope.prevSent.length-1){
    			$scope.currPrevMsg++;
    			$scope.msgInp = $scope.prevSent[$scope.currPrevMsg];
    		}
    		$scope.$digest();
    	}else if(e.which==27){
    		e.preventDefault();
    		$scope.currPrevMsg = $scope.prevSent.length;
    		$scope.msgInp = '';
    		$scope.$digest();
    	}
    });
    $scope.switchTabs = function(dir){
        console.log($scope.$parent.gameId)
        $scope.chatLocal = !!$scope.$parent.gameId && parseInt(dir);
    }
});
app.controller('loginCont', function($scope, miscFact,$timeout) {
    $scope.logMode = true;
    $scope.pwdStren = 0;
    $scope.passGud = {
        len: 0,
        caps: false,
        lower: false,
        num: false,
        symb: false,
        badWrd: false,
        sameUn: false
    };
    $scope.dupUn = false;
    $scope.checkDupUn = function() {
        if (!$scope.regUser) return false;
        miscFact.checkUnDup($scope.regUser).then(function(r) {
            $scope.dupUn = r.data == 'bad';
        });
    };
    $scope.getAbtHeight = function() {
        $timeout(function() {
            document.querySelector('.abt-bg').style.height = $('#abt-stuff').height()/0.9+'px';
        }, 0, false);

    };
    $scope.showAbt = false;
    $scope.getPwdStren = function() {
        //how stronk is pwrd?
        var str = 0,
            pwd = $scope.regPwdOne,
            badWrds = ['password', 'pass', '123', 'abc', 'admin'];
        $scope.passGud = {
            len: 0,
            caps: false,
            lower: false,
            num: false,
            symb: false,
            badWrd: false,
            sameUn: false
        };
        if (pwd.length > 16) {
            str += 8;
            $scope.passGud.len = 16;
        } else if (pwd.length > 12) {
            str += 6;
            $scope.passGud.len = 12;
        } else if (pwd.length > 8) {
            str += 4;
            $scope.passGud.len = 8;
        } else if (pwd.length > 4) {
            str += 2;
            $scope.passGud.len = 4;
        } else {
            $scope.passGud.len = false;
        }
        //now particular symbols
        if (pwd.match(/[A-Z]/)) {
            str += 1;
            $scope.passGud.caps = true;
        }
        if (pwd.match(/[a-z]/)) {
            str += 1;
            $scope.passGud.lower = true;
        }
        if (pwd.match(/[0-9]/)) {
            str += 1;
            $scope.passGud.num = true;
        }
        if (pwd.match(/!|@|#|\$|%|\/|\\|\^|&|\*|-|_/)) {
            str += 1;
            $scope.passGud.symb = true;
        }
        badWrds.forEach((w) => {
            if (str > 1 && pwd.indexOf(w) > -1) {
                //penalty for really common words.
                str -= 2;
                $scope.passGud.badWrd = true;
            }
        });
        if ($scope.regUser == pwd && str > 2) {
            str -= 3;
            $scope.passGud.sameUn = true;
        }
        $scope.pwdStren = str;
    };
  
    $scope.explPwd = function() {
        sandalchest.alert('Password Strength',`Password Criteria:<ul class='pwd-list'><li><span id='pwd-len-btn' style='background:hsl(${120*($scope.passGud.len)/16},100%,40%);'></span> ${!$scope.passGud.len?'Less than 4':'At least '+$scope.passGud.len} characters</li><li>${$scope.passGud.caps?'&#10003;':'&#10007;'} Contains a capital letter</li><li>${$scope.passGud.lower?'&#10003;':'&#10007;'} Contains a lowercase letter</li><li>${$scope.passGud.num?'&#10003;':'&#10007;'} Contains a number</li><li>${$scope.passGud.symb?'&#10003;':'&#10007;'} Contains a non-alphanumeric symbol (i.e., '@', or '#')</li><li>${!$scope.passGud.badWrd?'&#10003;':'&#10007;'} Does <i>not</i> contain any common sequences, like 'abc' or '123' or 'password'.</li><li>${!$scope.passGud.sameUn?'&#10003;':'&#10007;'} Is <i>not</i> the same as your username.</li></ul>`);
    };
    $scope.newUsr = function() {
        miscFact.regNewUsr($scope.regUser, $scope.regPwdOne).then(function(r) {
            if (r.data == 'DUPLICATE') {
                sandalchest.alert('Registration Error','Uh oh! Something went horribly wrong!');
            } else {
                //auto-login;
                miscFact.login($scope.regUser, $scope.regPwdOne).then(function(d) {
                    if (d.data == 'no') {
                        sandalchest.alert('Registration Error','There was an error while checking your username/password. Please try again.');
                    } else {
                        sandalchest.alert('Registration Successful','Welcome!', function(p) {
                            window.location.assign('../');
                        });
                    }
                });
            }
        });
    };
    $scope.log = function() {
        miscFact.login($scope.logUsr, $scope.logPwd).then(function(d) {
            if (d.data == 'no') {
                sandalchest.alert('Login error','Please check your username and/or password<hr/><i>Note:</i> While Conkr is under development, data may be deleted at any time!');
            } else {
                sandalchest.alert('Login Successful','Welcome back!', function(p) {
                    window.location.assign('../');
                });
            }
        });
    };
});

var socket = io(),
    socketRoom = null;
app.controller('conkrcon', function($scope, $http, fightFact, mapFact, miscFact, $sce) {
    //before anything, check to see if we're logged in!
    miscFact.chkLoggedStatus().then(function(r) {
        console.log('DATA', r.data);
        if (!r.data.result) window.location.assign('./login');
        $scope.user = r.data.name;
        miscFact.checkInGame(r.data.name).then(function(m) {
            console.log('PLAYER IS IN GAME:', m)
            if (m.data.game) {
                //load map this player's in.
                $scope.reloadGame(m.data.game);
                $scope.canJoin = false; //player cannot join a game while they're in one
            }
        })
    });
    $scope.win = {
        w: $(window).width() * 0.95,
        h: $(window).height() * 0.95
    };
    $scope.reloadGame = function(g) {
        //first, rebuild player-avatar object
        $scope.currGamePlayers = {};
        g.players.forEach((p, i) => {
            $scope.currGamePlayers[p] = g.avas[i];
        });
        //next, set correct game id
        $scope.gameId = g.gameId;
        console.log('GAME', g)
            //finally, map stuff!
        mapFact.loadOneMap(g.mapId).then(function(m) {
            console.log('result of attempt to get 1 map', m)
            $scope.pickMap(m.data.mapData, g.mapId, true);
            $scope.gameReady = true;
        })

    }
    $scope.logout = function() {
        miscFact.logout().then(function() {
            window.location.assign('./login');
        });
    };
    window.onkeyup = function(e) {
        if (e.which == 13 && $scope.showChat) {
            $('#msgInp').focus();
        } else if (e.which == 191) {
            $scope.showChat = true;
            $scope.$digest();
            $('#msgInp').focus();
        }
    };
    $scope.gameMenu = true;
    $scope.currGamePlayers = {};
    $scope.gameIsReady = true;
    $scope.gameSettingsPanel = 0;
    $scope.newNew = true; //for new game creation, create a completely new map?
    $scope.numCountries = 20;
    $scope.map = null;
    $scope.gameId = null;
    $scope.canJoin = true;
    $scope.potentialMaps = [];
    $scope.loadedMapImg = null;
    $scope.user = null;
    $scope.newMap = function() {
        var smootz = 101 - $scope.smoothing,
            numZones = Math.round($scope.numCountries / 0.3);
        $scope.map = mapFact.GetVoronoi($scope.win.h, $scope.win.w, numZones, smootz);
        $scope.map.init();
        $scope.gameMenu = false;
        sandalchest.confirm("Confirm Map", "Do you want to accept this map?", function(r) {
            if (r) {
                $scope.map.save().then(function(sr) {
                    $scope.countryLbls = $scope.map.counLblObjs();
                    sandalchest.dialog('Start Game', `Do you want to start a new game with this map (${sr.data.id})?<hr/>Password: <input type='password' id='newGamePwd'> <button class='btn btn-danger' onclick="angular.element('body').scope().pwdExpl()">?</button>`, {
                        buttons: [{
                            text: 'Create Game',
                            close: true,
                            click: function() {
                                //use sr.id to make a new game.
                            var ngpwd = document.querySelector('#newGamePwd').value;
                            fightFact.newGame(sr.data.id, $scope.user,ngpwd).then(function(g) {
                                $scope.gameId = g.data.id;
                                socket.emit('getGamePieces'{id:g.data.id});
                                console.log('Done! Game made!');
                                socket.emit('getGames', { x: true })
                            });
                            }
                        }, {
                            text: 'Cancel',
                            close: true,
                            click: function() {

                            }
                        }],
                        speed: 250
                    });
                });
            } else {
                //user doesnt like this map(Q_Q). reset
                $scope.map = null;
                $scope.gameMenu = true;
                $scope.$digest();
            }
        });
    };
    $scope.pwdExpl = function() {
        sandalchest.alert('Protected Games', 'If you include a password, only players who have that password can join. Leave this blank if you want a public game!', {
            rotation: -5
        })
    }
    socket.emit('getGames', { x: true })
    $scope.loadMaps = function() {
        //load all OLD maps for a NEW game!
        mapFact.loadMaps().then(function(r) {
            console.log('MAPS', r);
            $scope.potentialMaps = r.data;
            $scope.$digest();
        });
    };
    socket.on('replaceMap', function() {
        //force reload of maps, since one got updated or deleted or something.
        $scope.loadMaps();
    })
    socket.on('allGames', function(g) {
        console.log('FROM ALL GAMES', g);
        $scope.allGames = g;
        $scope.loadMaps();
        $scope.$digest();
    });
    $scope.deleteMap = function(id) {
        sandalchest.confirm('Delete Map', 'Are you sure you want to delete map ' + id + '?', function(n) {
            if (n) {
                mapFact.delMap(id);
            }
        })
    };
    $scope.pickTarg = false;
    $scope.moveArmies = true;
    var debugMode = false; //allows us to pick our own dudes as targets
    $scope.pickCell = function(ap) {
        //NEED TO IMPLEMENT ARMY MOVE MODE! ALSO SOCKETS FOR THIS.
        if ($scope.srcCell && $scope.map.diagram.cells[$scope.srcCell].country == ap.country && ap.status > 0) {
            ap.status = 0;
            $scope.srcCell = null;
            $scope.targCell = null;
            $scope.pickTarg = false;
            return true;
        } else if (!$scope.pickTarg && ap.usr == $scope.user) {
            //if we're not in target pick mode and this piece's user is us.
            $scope.armyPieces.forEach((p) => { p.status = 0 });
            //picking source cell
            $scope.srcCell = $scope.map.getCellNumByName(ap.country);
            ap.status = 1;
            $scope.targCell = null;
            $scope.pickTarg = true;
            return true;
        } else if (!$scope.moveArmies) {
            if ($scope.pickTarg && (ap.usr != $scope.user || debugMode)) {
                if (!mapFact.isNeighbor($scope.map.diagram.cells, $scope.srcCell, $scope.map.getCellNumByName(ap.country))) {
                    sandalchest.alert("Uh Oh!", "Hey! You can't attack " + ap.country + " from " + $scope.map.diagram.cells[$scope.srcCell].country + "! It's too far away!", { speed: 250 })
                    return false;
                }
                $scope.targCell = $scope.map.getCellNumByName(ap.country);
                ap.status = 2;
                $scope.pickTarg = false;
            } else if ($scope.pickTarg && ap.usr == $scope.user) {
                sandalchest.alert("Uh Oh!", "Hey! You can't attack yourself at " + ap.country + "!", { speed: 250 })
            }
        } else {
            if ($scope.pickTarg && ap.usr == $scope.user) {
                if (!mapFact.isNeighbor($scope.map.diagram.cells, $scope.srcCell, $scope.map.getCellNumByName(ap.country))) {
                    sandalchest.alert("Uh Oh!", `Hey! You can't move armies to ${ap.country} from ${$scope.map.diagram.cells[$scope.srcCell].country}! It's too far away!`, { speed: 250 })
                    return false;
                }
                var srcNum = $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country).num;
                if (srcNum < 2) {
                    sandalchest.alert('Uh Oh!', 'You have too few armies in the source country to move armies (less than two). You cannot desert a country!', { speed: 250 });
                    return false;
                }
                sandalchest.dialog({
                    buttons: [{
                        text: 'Move em!',
                        close: true,
                        click: function() {
                            console.log('wanna move', { num: parseInt(document.querySelector('#reqNumMove').value), usr: $scope.user, src: $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country), targ: ap, game: $scope.gameId })
                            socket.emit('moveArmies', { num: parseInt(document.querySelector('#reqNumMove').value), usr: $scope.user, src: $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country), targ: ap, game: $scope.gameId });
                            $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country).status = 0;
                            $scope.srcCell = null;
                            $scope.targCell = null;
                            ap.status = 0;
                            $scope.pickTarg = false;
                        }
                    }, {
                        text: 'Cancel',
                        close: true,
                        click: function() {
                            $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].country).status = 0;
                            $scope.srcCell = null;
                            $scope.targCell = null;
                            ap.status = 0;
                            $scope.pickTarg = false;
                        }
                    }],
                    speed: 250
                }, 'Army Movement', `How many armies do you want to move from ${$scope.map.diagram.cells[$scope.srcCell].country} to ${ap.country}? You can move a maximum of ${srcNum} armies. <br/> <input type="number" id="reqNumMove" value='1' min='1' max='${srcNum}'>`);

            } else if ($scope.pickTarg && ap.usr != $scope.user) {
                sandalchest.alert('Uh Oh!', `${ap.country} is currently occupied by another player. You'll need to conquer it first to move your armies there!`)
            }
        }
    }
    $scope.joinGame = function(g, pwd) {
        fightFact.joinGame(g, $scope.user, pwd).then(function(r) {
            if (r.data == 'gameLogErr') {
                sandalchest.alert('Join Error', 'This game\'s private, and you\'ve unfortunately entered the wrong password!')
                return false;
            }
            console.log('JOINED GAME:', r);
            socket.emit('getGames', { x: true })
        });
    };
    $scope.neighborTest = function(s, d) {
        console.log('tested cells are neighbors: ', mapFact.isNeighbor($scope.map.diagram.cells, s, d));
    }
    $scope.switchPlayMode = function() {
        sandalchest.confirm('Switch Modes', 'Are you sure you wanna stop moving armies and begin the attack phase?', function(res) {
            if (res && res != null) {
                $scope.moveArmies = false;
                $scope.$digest();
            }
        })
    }
    $scope.pickMap = function(m, n, old) {
        //load an OLD map for a NEW game
        //map is a new map created just now
        //OR, if 'old' is true, reload an old map and use for old game
        //(i.e., rejoin player to game)
        console.log('pikmap data', m, n, old)
        $scope.map = mapFact.GetVoronoi(m.bbox.yb, m.bbox.xr, m.countryNames.length, 20);
        for (var p in m) {
            $scope.map[p] = m[p];
        }
        $scope.map.initLoad(m.img);
        // $scope.countryLbls = $scope.map.counLblObjs();
        $scope.gameMenu = false;
        if (!old) {
            fightFact.newGame(n, $scope.user, pwd).then((x) => {
                socket.emit('getGames', { g: true });
                socket.emit('putInRoom', { id: x.data })
            });
        } else {
            socket.emit('putInRoom', { id: $scope.gameId })
        }
        $scope.armyPieces = [];
    };
    socket.on('updateArmies', function(d) {
        console.log('UPDATE ARMIES', d)
        d.players.forEach((p, i) => {
            $scope.currGamePlayers[p] = d.avas[i];
        })
        $scope.armyPieces = fightFact.placeArmies($scope.map, d.armies, $scope.currGamePlayers);
        $scope.$digest();
    })
    socket.on('gameReady', function(d) {
        $scope.gameIsReady = true;
        socket.emit('getGamePieces', d)
        console.log('AT GAMEREADY, D IS', d);
    })
    $scope.toggleNewMode = function(n) {
        $scope.newNew = n > 0;
        if (!$scope.newNew) {
            $scope.loadMaps();
        }
    };
    $scope.startGame = function(id) {
        sandalchest.confirm(`Start Game ${id}`, `Are you sure you wanna start game ${id}? Starting a game is not reversable, and prevents any more players from joining.`, function(r) {
            if (r) {
                fightFact.startGame(id).then(function(r) {
                    socket.emit('gameStarted', r)
                });
            }
        });
    };
    socket.on('putInGame', (c) => {
        console.log('PUT IN GAME', c)
        if (c.data.players.indexOf($scope.user) > -1) {
            socket.emit('putInRoom', c.data)
        }
    })
    $scope.avgCounInfo = function() {
        sandalchest.alert('Country Number', 'Because of how the map is generated, the actual number of countries may or may not be exactly the number here.');
    };
    $scope.smoothInfo = function() {
        sandalchest.alert('Map Smoothing', 'Without smoothing, the shapes generated by the map algorithm (a <a href="https://en.wikipedia.org/wiki/Voronoi_diagram" target="_blank">Voronoi Diagram</a>) are very random. Smoothing \'pushes\' the shapes towards being equal size.');
    };
    $scope.doAttack = function(s, d, ra) {
        var rd = null,
            dname = $scope.map.diagram.cells[d].name;
        for (var i = 0; i < $scope.armyPieces.length; i++) {
            if ($scope.armyPieces[i].country == dname) {
                //defender can roll with a max of two doodz
                rd = $scope.armyPieces[i].num < 3 ? $scope.armyPieces[i].num : 2;
                break;
            }
        }
        if (rd > ra) ra = rd; //defender cannot defend with more armies than attacker attacks with
        if (mapFact.isNeighbor($scope.map.diagram.cells, s, d)) {
            fightFact.doFight($scope.user, $scope.getAPByName($scope.map.diagram.cells[s].name), $scope.getAPByName($scope.map.diagram.cells[d].name), ra, rd, $scope.gameId)
        }
    }
    $scope.getAPByName = function(name) {
        for (var i = 0; i < $scope.armyPieces.length; i++) {
            if ($scope.armyPieces[i].country == name) {
                return $scope.armyPieces[i];
            }
        }
        return false;
    }
    $scope.startAttack = function() {
        console.log('SOURCE CELL', $scope.map.diagram.cells[$scope.srcCell])
        if ((!$scope.srcCell && $scope.srcCell !== 0) || (!$scope.targCell && $scope.targCell !== 0)) {
            sandalchest.alert('Attack Issue', 'You need both an attacker and a target!')
        } else if ($scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name) && $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).num < 2) {
            sandalchest.alert("Not Enough Armies", `You can't attack from ${$scope.map.diagram.cells[$scope.srcCell].name}! Attacking countries need at least two armies: One to attack, and one to stay home!`)
        } else {
            var maxPain = $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).num < 5 ? $scope.getAPByName($scope.map.diagram.cells[$scope.srcCell].name).num - 1 : 3;
            sandalchest.prompt('Army Strength', `How many armies do you wanna attack with? You can attack with at most ${maxPain} armies.`, function(res) {
                res = parseInt(res);
                if (isNaN(res) || res == 0) {
                    return false;
                }
                console.log($scope.map.diagram.cells[$scope.srcCell].name, 'attacking', $scope.map.diagram.cells[$scope.targCell].name, 'with', res, 'armies.');
                $scope.doAttack($scope.srcCell, $scope.targCell, res);
            })
        }
    };
    socket.on('rcvDoFight', function(res) {
        var defr = $scope.getAPByName(res.cd.country),
            atkr = $scope.getAPByName(res.ca.country),
            replProps = [
                'usr', 'lbl', 'num'
            ];
        if (res.status) {
            //zone 'conkrd', so replace defending user with attacking user
            res.cd.usr = res.ca.usr;
        }
        console.log('from rcvDoFight, we get', defr, atkr);
        replProps.forEach((p) => {
            defr[p] = res.cd[p];
            atkr[p] = res.ca[p];
        })
        $scope.$apply()
    });
    $scope.nextTurn = function() {
        sandalchest.confirm('End Turn', 'Are you sure you want to end your turn?', function(res) {
            console.log(res)
            if (res && res != null) {
                fightFact.nextTurn($scope.map, $scope.gameId, $scope.user);
            }
        })
    }
});

app.factory('fightFact', function($rootScope, $http) {
    // note: we are NOT writing an AI player for Conkr, as AI for playing Risk™ is notoriously difficult to write
    var getCellCoords = function(m, c) {
        console.log('Getting cell coords for', c);
        for (var i = 0; i < m.length; i++) {
            if (m[i].name == c) {
                return m[i].site;
            }
        }
        return false;
    }
    return {
        getMaxArmy: function(c, m) {
            var attackPenalty = m ? 1 : 0;
            // note that this will at min be > 0.
            return Math.floor(c.army.num - attackPenalty);
        },
        doFight: function(usr, ca, cd, ra, rd, id) {
            socket.emit('sendDoFight', {
                user: usr,
                ca: ca,
                cd: cd,
                ra: ra,
                rd: rd,
                gameId: id
            });
        },
        nextTurn: function(map, game, usr) {
            socket.emit('nextTurn', { conts: map.getContinents(), game: game, usr: usr })
        },
        newGame: function(n, p, pwd) {
            return $http.post('/game/new', { id: n, player: p, pwd: pwd }).then(function(p) {
                return p;
            });
        },
        placeArmies: function(m, a, l) {
            //shouldn't base just be 0,0?
            //m:map, a: army, l: labels (unicode) organized by playaz
            var pieces = [];
            for (var n = 0; n < a.length; n++) {
                var site = getCellCoords(m.diagram.cells, a[n].country);
                var boxwid = document.querySelector('canvas').getContext("2d").measureText(a[n].country).width * 1.2;
                // alert('BOX WID',boxwid)
                pieces.push({
                    country: a[n].country,
                    num: a[n].num,
                    lbl: l[a[n].user],
                    usr: a[n].user,
                    x: site.x - (boxwid / 2) - 8,
                    y: site.y,
                    fullName: a[n].user + ' - ' + a[n].country + ' - ' + a[n].num + (a[n].num > 1 ? " armies" : " army"),
                    wid: boxwid,
                    status: 0 //0 = unpicked (neither target nor source), 1 = source (attacking from this loc), 2 = target (attacking this loc)
                });
            }
            return pieces;
        },
        joinGame: function(m, p, pwd) {
            //join a not-yet-started game;
            return $http.post('/game/join', { gameId: m, player: p, pwd: pwd }, function(p) {
                return p;
            });
        },
        addArmies: function(game) {
            //function to add armies for each user
            socket.emit('sendAddArmies', { game: game });
        },
        saveGame: function(id, map) {
            if (!id) {
                sandalchest.alert('Map save error: no map id!', function() {
                    return false;
                });
            } else {
                var gameData = {
                    gameId: id,
                    armies: [],
                    mapId: map.id
                };
                map.diagram.cells.forEach((c, i) => {
                    if (c.name) {
                        gameData.armies.push({
                            user: c.army.usr,
                            country: c.name,
                            num: c.army.num
                        });
                    }
                });
                return $http.post('/game/saveGame', gameData);
            }
        },
        startGame: function(id) {
            //creator of a game sets it to started, meaning no more doodz can join.
            return $http.get('/game/startGame/' + id).then(function(r) {
                return r;
            });
        }
    };
});

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
        isBorderNeighbor: function(c, s, d) {
            //OLD VERSION of isNeighbor, only returns true if start and destination are immediate neigbors
            //c: cells (array), s: start cell, d: destination cell
            if (!c[s] || !c[d]) {
                throw new Error('cells not found!')
                return;
            }
            console.log('Cells', c, 'source cell', c[s], 'target', c[d])
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
        isWater: function(c, x, y) {
            //test if a cell at point (x,y) is water (i.e., isLand==false)
            for (var i = 0; i < c.length; i++) {
                if (c[i].site.x == x && c[i].site.y == y && !c[i].isLand) {
                    return i;
                }
            }
            return false;
        },
        isNeighbor: function(c, s, d) {
            //detect if start is either A) an immediate neighbor or B) immediately across the water from dest
            //c: cells (array), s: start cell, d: destination cell
            if (!c[s] || !c[d]) {
                //error reading cells, not found
                throw new Error('cells not found!')
                return;
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
                    surroundingOceanCandidates.push(this.isWater(c, testSite.x, testSite.y))
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
        delMap: function(id) {
            return $http.delete('/map/del/' + id, function(r) {
                return r;
            })
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
                        p1 = this.getStartpoint(halfedge);
                        p2 = this.getEndpoint(halfedge);
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
                        p1 = this.getStartpoint(halfedge);
                        p2 = this.getEndpoint(halfedge);
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
                // counLblObjs: function() {
                //     var ctx = this.canvas.getContext('2d'); //for measuring
                //     var arr = [];
                //     for (var i = 0; i < this.diagram.cells.length; i++) {
                //         var cell = this.diagram.cells[i];
                //         if (cell.name && cell.isLand) {
                //             arr.push({
                //                 boxWid: ctx.measureText(cell.name) + 4,
                //                 boxHeight: 13,
                //                 boxLeft: Math.floor(cell.site.x - (textBoxWid / 2) - 2),
                //                 boxTop: cell.site.y - 2
                //             })
                //         }
                //     }
                // },
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
                pointIntersection: function(cell, x, y) {
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
                getStartpoint: function(h) {
                    return h.edge.lSite === h.site ? h.edge.va : h.edge.vb;
                },
                getEndpoint: function(h) {
                    return h.edge.lSite === h.site ? h.edge.vb : h.edge.va;
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
                        if (this.pointIntersection(cell, x, y) > 0) {
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
                        if (this.pointIntersection(cell, x, y) > 0) {
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
                        v = this.getStartpoint(halfedges[0]);
                    ctx.moveTo(v.x, v.y);

                    for (var iHalfedge = 0; iHalfedge < nHalfedges; iHalfedge++) {
                        v = this.getEndpoint(halfedges[iHalfedge]);
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
                getCellNumByName: function(n) {
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        if (this.diagram.cells[i].name == n) return i;
                    }
                    return false;
                },
                getContinents: function() {
                    this.doneCouns = [];
                    this.allConts = [];
                    for (var i = 0; i < this.diagram.cells.length; i++) {
                        this.findNeighbors(i, true);
                    }
                    console.log(this.allConts)
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

app.factory('miscFact', function($rootScope, $http) {
    return {
        getUsr: function() {
            return $http.get('/user/currUsrData').then(function(r){
            	return r;
            });
        },
        chkLoggedStatus:function(){
        	return $http.get('/user/chkLog').then(function(r){
            	return r;
            });
        },
        checkUnDup: function(u){
        	return $http.get('/user/nameOkay/'+u).then(function(r){
        		return r;
        	});
        },
        regNewUsr:function(u,p){
        	return $http.post('/user/new',{user:u,password:p}).then(function(r){
        		return r;
        	});
        },
        login:function(u,p){
        	return $http.post('/user/login',{user:u,password:p}).then(function(r){
        		return r;
        	});
        },
        logout:function(u,p){
        	return $http.get('/user/logout',{user:u,password:p}).then(function(r){
        		return r;
        	});
        },
        checkInGame:function(u){
            return $http.get('/user/checkInGame/'+u).then(function(r){
                return r;
            })
        }
    };
});

app.factory('socket', function ($rootScope) {
  console.log('socket factory!');
  var socket = io.connect();
  console.log('socket factory!');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () { 
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});