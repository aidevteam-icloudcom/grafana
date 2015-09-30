define([
  './helpers',
  'moment',
  'app/plugins/datasource/prometheus/datasource'
], function(helpers, moment) {
  'use strict';

  describe('PrometheusDatasource', function() {
    var ctx = new helpers.ServiceTestContext();

    beforeEach(module('grafana.services'));
    beforeEach(ctx.createService('PrometheusDatasource'));
    beforeEach(function() {
      ctx.ds = new ctx.service({ url: '', user: 'test', password: 'mupp' });
    });

    describe('When querying prometheus with one target using query editor target spec', function() {
      var results;
      var urlExpected = '/api/v1/query_range?query=' +
                        encodeURIComponent('test{job="testjob"}') +
                        '&start=1443438675&end=1443460275&step=60s';
      var query = {
        range: { from: moment(1443438674760), to: moment(1443460274760) },
        targets: [{ expr: 'test{job="testjob"}' }],
        interval: '60s'
      };

      var response = {
        "status":"success",
        "data":{
          "resultType":"matrix",
          "result":[{
            "metric":{"__name__":"test", "job":"testjob"},
            "values":[[1443454528,"3846"]]
          }]
        }
      };

      beforeEach(function() {
        ctx.$httpBackend.expect('GET', urlExpected).respond(response);
        ctx.ds.query(query).then(function(data) { results = data; });
        ctx.$httpBackend.flush();
      });

      it('should generate the correct query', function() {
        ctx.$httpBackend.verifyNoOutstandingExpectation();
      });

      it('should return series list', function() {
        expect(results.data.length).to.be(1);
        expect(results.data[0].target).to.be('test{job="testjob"}');
      });

    });

    describe('When performing metricFindQuery', function() {
      var results;
      var response;

      it('label_values(resource) should generate label search query', function() {
        response = {
          status: "success",
          data: ["value1", "value2", "value3"]
        };
        ctx.$httpBackend.expect('GET', '/api/v1/label/resource/values').respond(response);
        ctx.ds.metricFindQuery('label_values(resource)').then(function(data) { results = data; });
        ctx.$httpBackend.flush();
        ctx.$rootScope.$apply();
        expect(results.length).to.be(3);
      });

      it('label_values(metric, resource) should generate count metric query', function() {
        response = {
          status: "success",
          data:{
            resultType: "vector",
            result:[
              {metric:{resource:"value1"},value:[]},
              {metric:{resource:"value2"},value:[]},
              {metric:{resource:"value3"},value:[]}
            ]
          }
        };
        ctx.$httpBackend.expect('GET', /\/api\/v1\/query\?query=count\(metric\)%20by%20\(resource\)&time=.*/).respond(response);
        ctx.ds.metricFindQuery('label_values(metric, resource)').then(function(data) { results = data; });
        ctx.$httpBackend.flush();
        ctx.$rootScope.$apply();
        expect(results.length).to.be(3);
      });

      it('metrics(metric.*) should generate metric name query', function() {
        response = {
          status: "success",
          data:["metric1","metric2","metric3","nomatch"]
        };
        ctx.$httpBackend.expect('GET', '/api/v1/label/__name__/values').respond(response);
        ctx.ds.metricFindQuery('metrics(metric.*)').then(function(data) { results = data; });
        ctx.$httpBackend.flush();
        ctx.$rootScope.$apply();
        expect(results.length).to.be(3);
      });

    });
  });
});

