import assert from 'node:assert/strict';
import {scrollGeometry} from '../../src/lib/scrollNavigation.js';
assert.deepEqual(scrollGeometry({clientHeight:600,scrollHeight:600,scrollTop:0},500),{visible:false,height:500,offset:0});
assert.deepEqual(scrollGeometry({clientHeight:600,scrollHeight:3000,scrollTop:1200},500),{visible:true,height:100,offset:200});
assert.equal(scrollGeometry({clientHeight:600,scrollHeight:6000,scrollTop:5400},500).offset,450);
console.log('PASS proportional geometry, middle/bottom positions, and short-page hiding');
