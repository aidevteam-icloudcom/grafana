package sql

import (
	"errors"
	"strings"

	parser "github.com/krasun/gosqlparser"
	"github.com/xwb1989/sqlparser"
)

// TablesList returns a list of tables for the sql statement
func TablesList(rawSQL string) ([]string, error) {
	stmt, err := sqlparser.Parse(rawSQL)
	if err != nil {
		tables, err := parse(rawSQL)
		if err != nil {
			return parseTables(rawSQL)
		}
		return tables, nil
	}

	tables := []string{}
	switch kind := stmt.(type) {
	case *sqlparser.Select:
		for _, t := range kind.From {
			buf := sqlparser.NewTrackedBuffer(nil)
			t.Format(buf)
			table := buf.String()
			if table != "dual" && !strings.HasPrefix(table, "(") {
				tables = append(tables, buf.String())
			}
		}
	default:
		return parseTables(rawSQL)
	}
	if len(tables) == 0 {
		return parseTables(rawSQL)
	}
	return tables, nil
}

// uses a simple tokenizer
func parse(rawSQL string) ([]string, error) {
	query, err := parser.Parse(rawSQL)
	if err != nil {
		return nil, err
	}
	if query.GetType() == parser.StatementSelect {
		sel, ok := query.(*parser.Select)
		if ok {
			return []string{sel.Table}, nil
		}
	}
	return nil, err
}

func parseTables(rawSQL string) ([]string, error) {
	checkSql := strings.ToUpper(rawSQL)
	rawSQL = strings.ReplaceAll(rawSQL, "\n", " ")
	if strings.HasPrefix(checkSql, "SELECT") || strings.HasPrefix(rawSQL, "WITH") {
		tables := []string{}
		tokens := strings.Split(rawSQL, " ")
		checkNext := false
		takeNext := false
		for _, token := range tokens {
			t := strings.ToUpper(token)
			t = strings.TrimSpace(t)

			if takeNext {
				tables = append(tables, token)
				checkNext = false
				takeNext = false
				continue
			}
			if checkNext {
				if strings.Contains(t, "(") {
					checkNext = false
					continue
				}
				if strings.Contains(t, ",") {
					values := strings.Split(token, ",")
					for _, v := range values {
						v := strings.TrimSpace(v)
						if v != "" {
							tables = append(tables, v)
						} else {
							takeNext = true
							break
						}
					}
					continue
				}
				tables = append(tables, token)
				checkNext = false
			}
			if t == "FROM" {
				checkNext = true
			}
		}
		return tables, nil
	}
	return nil, errors.New("not a select statement")
}
