package postgres

import (
	"testing"

	"github.com/grafana/grafana/pkg/tsdb"
	. "github.com/smartystreets/goconvey/convey"
)

func TestMacroEngine(t *testing.T) {
	Convey("MacroEngine", t, func() {

		Convey("interpolate __time function", func() {
			engine := &PostgresMacroEngine{}

			sql, err := engine.Interpolate("select $__time(time_column)")
			So(err, ShouldBeNil)

			So(sql, ShouldEqual, "select time_column AS \"time\"")
		})

		Convey("interpolate __time function wrapped in aggregation", func() {
			engine := &PostgresMacroEngine{}

			sql, err := engine.Interpolate("select min($__time(time_column))")
			So(err, ShouldBeNil)

			So(sql, ShouldEqual, "select min(time_column AS \"time\")")
		})

		Convey("interpolate __timeFilter function", func() {
			engine := &PostgresMacroEngine{
				TimeRange: &tsdb.TimeRange{From: "5m", To: "now"},
			}

			sql, err := engine.Interpolate("WHERE $__timeFilter(time_column)")
			So(err, ShouldBeNil)

			So(sql, ShouldEqual, "WHERE time_column >= to_timestamp(18446744066914186738) AND time_column <= to_timestamp(18446744066914187038)")
		})

		Convey("interpolate __timeFrom function", func() {
			engine := &PostgresMacroEngine{
				TimeRange: &tsdb.TimeRange{From: "5m", To: "now"},
			}

			sql, err := engine.Interpolate("select $__timeFrom(time_column)")
			So(err, ShouldBeNil)

			So(sql, ShouldEqual, "select to_timestamp(18446744066914186738)")
		})

		Convey("interpolate __timeGroup function", func() {
			engine := &PostgresMacroEngine{
				TimeRange: &tsdb.TimeRange{From: "5m", To: "now"},
			}

			sql, err := engine.Interpolate("GROUP BY $__timeGroup(time_column,'5m')")
			So(err, ShouldBeNil)

			So(sql, ShouldEqual, "GROUP BY (extract(epoch from \"time_column\")/extract(epoch from '5m'::interval))::int")
		})

		Convey("interpolate __timeTo function", func() {
			engine := &PostgresMacroEngine{
				TimeRange: &tsdb.TimeRange{From: "5m", To: "now"},
			}

			sql, err := engine.Interpolate("select $__timeTo(time_column)")
			So(err, ShouldBeNil)

			So(sql, ShouldEqual, "select to_timestamp(18446744066914187038)")
		})

		Convey("interpolate __unixEpochFilter function", func() {
			engine := &PostgresMacroEngine{
				TimeRange: &tsdb.TimeRange{From: "5m", To: "now"},
			}

			sql, err := engine.Interpolate("select $__unixEpochFilter(18446744066914186738)")
			So(err, ShouldBeNil)

			So(sql, ShouldEqual, "select 18446744066914186738 >= 18446744066914186738 AND 18446744066914186738 <= 18446744066914187038")
		})

		Convey("interpolate __unixEpochFrom function", func() {
			engine := &PostgresMacroEngine{
				TimeRange: &tsdb.TimeRange{From: "5m", To: "now"},
			}

			sql, err := engine.Interpolate("select $__unixEpochFrom()")
			So(err, ShouldBeNil)

			So(sql, ShouldEqual, "select 18446744066914186738")
		})

		Convey("interpolate __unixEpochTo function", func() {
			engine := &PostgresMacroEngine{
				TimeRange: &tsdb.TimeRange{From: "5m", To: "now"},
			}

			sql, err := engine.Interpolate("select $__unixEpochTo()")
			So(err, ShouldBeNil)

			So(sql, ShouldEqual, "select 18446744066914187038")
		})

	})
}
